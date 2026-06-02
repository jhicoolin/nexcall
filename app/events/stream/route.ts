import { getRecentEvents, subscribeEvents } from "../../../lib/misato/runtime/event-bus";
import { assertOwnerJson } from "../../../lib/misato/owner-guard";
import { buildMisatoCorsHeaders, misatoOptionsResponse, withMisatoCors } from "../../../lib/misato/http/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return misatoOptionsResponse(request);
}

export async function GET(request: Request) {
  const unauthorized = await assertOwnerJson(request);
  if (unauthorized) return withMisatoCors(unauthorized, request);

  const encoder = new TextEncoder();
  const lastEventId = request.headers.get("last-event-id") || undefined;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  const safeWrite = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: string) => {
    if (closed) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writeEvent = (event: unknown) => safeWrite(controller, `data: ${JSON.stringify(event)}\n\n`);

      getRecentEvents(lastEventId).forEach(writeEvent);

      unsubscribe = subscribeEvents((event) => writeEvent(event));

      heartbeat = setInterval(() => {
        safeWrite(
          controller,
          `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`
        );
      }, 15000);

      // No synthetic context_loaded event here: the stream should only carry real runtime activity.
      // @ts-ignore
      controller.oncancel = () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
      };
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...buildMisatoCorsHeaders(request)
    }
  });
}
