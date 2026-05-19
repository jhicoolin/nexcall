const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;

function linearToMulawSample(sample: number) {
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > MULAW_CLIP) sample = MULAW_CLIP;
  sample += MULAW_BIAS;

  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; mask >>= 1) {
    exponent -= 1;
  }

  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function mulawToLinearSample(sample: number) {
  sample = ~sample & 0xff;
  const sign = sample & 0x80;
  const exponent = (sample >> 4) & 0x07;
  const mantissa = sample & 0x0f;
  let value = ((mantissa << 3) + MULAW_BIAS) << exponent;
  value -= MULAW_BIAS;

  return sign ? -value : value;
}

function resamplePcm16(samples: Int16Array, sourceRate: number, targetRate: number) {
  if (sourceRate === targetRate) return samples;

  const ratio = sourceRate / targetRate;
  const length = Math.max(1, Math.round(samples.length / ratio));
  const output = new Int16Array(length);

  for (let i = 0; i < length; i += 1) {
    const sourceIndex = i * ratio;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, samples.length - 1);
    const blend = sourceIndex - leftIndex;
    output[i] = Math.round(samples[leftIndex] * (1 - blend) + samples[rightIndex] * blend);
  }

  return output;
}

function writeAscii(buffer: Buffer, offset: number, value: string) {
  buffer.write(value, offset, value.length, "ascii");
}

export function encodeWavPcm16(samples: Int16Array, sampleRate = 8000) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  writeAscii(buffer, 0, "RIFF");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  writeAscii(buffer, 8, "WAVE");
  writeAscii(buffer, 12, "fmt ");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  writeAscii(buffer, 36, "data");
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  return buffer;
}

export function mulawBase64ToWavBuffer(base64Audio: string) {
  const mulaw = Buffer.from(base64Audio, "base64");
  const samples = new Int16Array(mulaw.length);

  for (let i = 0; i < mulaw.length; i += 1) {
    samples[i] = mulawToLinearSample(mulaw[i]);
  }

  return encodeWavPcm16(samples, 8000);
}

function decodeWavPcm(buffer: Buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Hugging Face TTS must return WAV audio for Twilio streaming.");
  }

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    }

    if (chunkId === "data") {
      dataOffset = chunkStart;
      dataSize = chunkSize;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (audioFormat !== 1 || !channels || !sampleRate || !dataOffset || !dataSize) {
    throw new Error("Only PCM WAV audio can be converted to Twilio mu-law.");
  }

  const frames = Math.floor(dataSize / (channels * (bitsPerSample / 8)));
  const samples = new Int16Array(frames);

  for (let frame = 0; frame < frames; frame += 1) {
    let mixed = 0;

    for (let channel = 0; channel < channels; channel += 1) {
      const sampleOffset = dataOffset + (frame * channels + channel) * (bitsPerSample / 8);

      if (bitsPerSample === 16) mixed += buffer.readInt16LE(sampleOffset);
      else if (bitsPerSample === 8) mixed += (buffer.readUInt8(sampleOffset) - 128) << 8;
      else throw new Error("Only 8-bit or 16-bit PCM WAV audio can be converted.");
    }

    samples[frame] = Math.round(mixed / channels);
  }

  return { samples, sampleRate };
}

/**
 * Converts Hugging Face WAV output into Twilio's outbound Media Stream format:
 * raw 8 kHz mu-law audio encoded as base64, with no container header bytes.
 */
export function wavArrayBufferToMulawBase64(audio: ArrayBuffer) {
  const decoded = decodeWavPcm(Buffer.from(audio));
  const samples = resamplePcm16(decoded.samples, decoded.sampleRate, 8000);
  const mulaw = Buffer.alloc(samples.length);

  for (let i = 0; i < samples.length; i += 1) {
    mulaw[i] = linearToMulawSample(samples[i]);
  }

  return mulaw.toString("base64");
}

export function joinMulawBase64Chunks(chunks: string[]) {
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk, "base64"))).toString("base64");
}
