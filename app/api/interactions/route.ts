import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { verifyKey } from 'discord-interactions';
// @ts-ignore — JS modules in discord/ subfolder
import { route } from '@/discord/src/router.js';

export const runtime = 'nodejs';
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
    console.error('DISCORD_PUBLIC_KEY is not configured');
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

    // Yield one microtask so synchronous res.json() calls (e.g. deferred in /setup) run first
    await Promise.resolve();

    if (fakeRes.headersSent && responseData?.type === 5) {
      // /setup: deferred — return type:5 immediately, keep function alive via after()
      after(handlerPromise);
      return NextResponse.json({ type: 5 });
    }

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
