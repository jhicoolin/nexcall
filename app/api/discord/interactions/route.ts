import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { verifyKey } from 'discord-interactions';
// @ts-ignore — JS module in discord/ subfolder
import { route } from '@/discord/src/router.js';

// Needs Node.js runtime (not Edge) for Buffer and discord-interactions
export const runtime = 'nodejs';

// 60s for /setup which creates multiple channels via Discord REST
export const maxDuration = 60;

interface FakeRes {
  headersSent: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: (data: any) => FakeRes;
  status: (code: number) => { json: (data: unknown) => void };
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-signature-ed25519') ?? '';
  const timestamp = req.headers.get('x-signature-timestamp') ?? '';

  if (!signature || !timestamp) {
    return new NextResponse('Missing signature headers', { status: 401 });
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('DISCORD_PUBLIC_KEY env var is not set');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }

  const isValid = verifyKey(rawBody, signature, timestamp, publicKey);
  if (!isValid) {
    return new NextResponse('Invalid request signature', { status: 401 });
  }

  const interaction = JSON.parse(rawBody.toString('utf8'));

  // Discord PING — required for endpoint verification
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Capture response via fake res object (command handlers call res.json())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let responseData: any;
  const fakeRes: FakeRes = {
    headersSent: false,
    json(data) {
      if (!this.headersSent) {
        responseData = data;
        this.headersSent = true;
      }
      return this;
    },
    status(_code: number) {
      return { json: (data: unknown) => { responseData = data; } };
    },
  };

  try {
    const handlerPromise: Promise<void> = route(interaction, fakeRes);

    // Yield one microtask so synchronous res.json() calls (like the deferred
    // response in /setup) run before we check responseData.
    await Promise.resolve();

    if (fakeRes.headersSent && responseData?.type === 5) {
      // Deferred response: /setup sends type:5 then continues async channel creation.
      // next/server `after` keeps the function alive after the response is sent.
      after(handlerPromise);
      return NextResponse.json({ type: 5 });
    }

    // All other commands: wait for full completion before responding
    await handlerPromise;

    return NextResponse.json(
      responseData ?? { type: 4, data: { content: 'No response generated.', flags: 64 } }
    );
  } catch (err) {
    console.error('Discord interaction error:', err);
    return NextResponse.json({
      type: 4,
      data: { content: 'Genie hit an error. Please try again.', flags: 64 },
    });
  }
}
