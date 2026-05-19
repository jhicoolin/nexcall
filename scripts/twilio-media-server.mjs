import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.MEDIA_SERVER_PORT || 8080);
const PATHNAME = process.env.MEDIA_SERVER_PATH || "/twilio-media";
const AI_TURN_ENDPOINT =
  process.env.AI_TURN_ENDPOINT ||
  `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/ai/respond`;
const AI_TURN_API_TOKEN = process.env.AI_TURN_API_TOKEN || "";
const MEDIA_CHUNKS_PER_TURN = Number(process.env.MEDIA_CHUNKS_PER_TURN || 120);

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function websocketAcceptKey(key) {
  return crypto.createHash("sha1").update(`${key}${WS_GUID}`).digest("base64");
}

function encodeTextFrame(text) {
  const payload = Buffer.from(text);
  const length = payload.length;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }

  if (length <= 0xffff) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
}

function parseFrames(state, chunk) {
  state.buffer = Buffer.concat([state.buffer, chunk]);
  const frames = [];

  while (state.buffer.length >= 2) {
    const first = state.buffer[0];
    const second = state.buffer[1];
    const opcode = first & 0x0f;
    const masked = Boolean(second & 0x80);
    let length = second & 0x7f;
    let offset = 2;

    if (length === 126) {
      if (state.buffer.length < offset + 2) break;
      length = state.buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (state.buffer.length < offset + 8) break;
      length = Number(state.buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (state.buffer.length < offset + maskLength + length) break;

    const mask = masked ? state.buffer.subarray(offset, offset + 4) : null;
    offset += maskLength;

    const payload = Buffer.from(state.buffer.subarray(offset, offset + length));
    if (mask) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= mask[i % 4];
      }
    }

    frames.push({ opcode, payload });
    state.buffer = state.buffer.subarray(offset + length);
  }

  return frames;
}

async function requestAiTurn(session, audioMulawBase64) {
  const response = await fetch(AI_TURN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AI_TURN_API_TOKEN ? { "x-ai-turn-token": AI_TURN_API_TOKEN } : {})
    },
    body: JSON.stringify({
      clientId: session.clientId,
      callerPhone: session.callerPhone,
      callSid: session.callSid,
      audioMulawBase64
    })
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "AI turn endpoint failed.");
  }

  return result;
}

function joinAudioChunks(chunks) {
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk, "base64"))).toString("base64");
}

function sendTwilioAudio(socket, streamSid, audioMulawBase64) {
  if (!audioMulawBase64 || !streamSid) return;

  socket.write(
    encodeTextFrame(
      JSON.stringify({
        event: "media",
        streamSid,
        media: {
          payload: audioMulawBase64
        }
      })
    )
  );
  socket.write(
    encodeTextFrame(
      JSON.stringify({
        event: "mark",
        streamSid,
        mark: {
          name: `ai-response-${Date.now()}`
        }
      })
    )
  );
}

function createSession(socket) {
  return {
    socket,
    streamSid: "",
    callSid: "",
    clientId: "",
    callerPhone: "",
    calledPhone: "",
    audioChunks: [],
    processing: false
  };
}

async function maybeProcessTurn(session) {
  if (session.processing || session.audioChunks.length < MEDIA_CHUNKS_PER_TURN) return;

  session.processing = true;
  const chunks = session.audioChunks.splice(0, session.audioChunks.length);

  try {
    const result = await requestAiTurn(session, joinAudioChunks(chunks));
    sendTwilioAudio(session.socket, session.streamSid, result.audioMulawBase64);
    console.log(
      `[ai-turn] client=${session.clientId} call=${session.callSid} heard="${result.transcript}" said="${result.text}"`
    );
    if (result.terminated) {
      console.log(`[ai-turn-terminated] client=${session.clientId} call=${session.callSid}`);
      setTimeout(() => session.socket.end(), 800);
    }
  } catch (error) {
    console.error("[ai-turn-error]", error);
  } finally {
    session.processing = false;
  }
}

function handleTwilioMessage(session, message) {
  if (message.event === "start") {
    const custom = message.start?.customParameters || {};
    session.streamSid = message.start?.streamSid || message.streamSid || "";
    session.callSid = custom.callSid || message.start?.callSid || "";
    session.clientId = custom.clientId || "";
    session.callerPhone = custom.callerPhone || "";
    session.calledPhone = custom.calledPhone || "";
    console.log(`[start] client=${session.clientId} call=${session.callSid}`);
  }

  if (message.event === "media" && message.media?.payload) {
    session.audioChunks.push(message.media.payload);
    void maybeProcessTurn(session);
  }

  if (message.event === "stop") {
    console.log(`[stop] client=${session.clientId} call=${session.callSid}`);
  }
}

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Revenue Guard Twilio Media Server is running.\n");
});

server.on("upgrade", (request, socket) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname !== PATHNAME) {
    socket.destroy();
    return;
  }

  const key = request.headers["sec-websocket-key"];
  if (!key || Array.isArray(key)) {
    socket.destroy();
    return;
  }

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${websocketAcceptKey(key)}`,
      "",
      ""
    ].join("\r\n")
  );

  const state = { buffer: Buffer.alloc(0) };
  const session = createSession(socket);

  socket.on("data", (chunk) => {
    for (const frame of parseFrames(state, chunk)) {
      if (frame.opcode === 0x8) {
        socket.end();
        return;
      }

      if (frame.opcode !== 0x1) continue;

      try {
        handleTwilioMessage(session, JSON.parse(frame.payload.toString("utf8")));
      } catch (error) {
        console.error("[ws-parse-error]", error);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Twilio Media Server listening on ws://localhost:${PORT}${PATHNAME}`);
  console.log(`AI turn endpoint: ${AI_TURN_ENDPOINT}`);
});
