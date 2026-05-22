/**
 * TEMPORARY DEBUG ENDPOINT — remove after fixing the outbound call issue.
 * POST /api/debug-call with body { secret: "nexcall-debug-2026" }
 * Returns the raw ElevenLabs response so we can see exactly what's failing.
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Simple secret gate — not production security, just debug gate
    if (body?.secret !== 'nexcall-debug-2026') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const phoneNumberId =
      process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID ||
      process.env.ELEVENLABS_PHONE_NUMBER_ID ||
      process.env.TWILIO_PHONE_NUMBER_ID;

    // Return config status (no actual key values exposed)
    const configStatus = {
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING',
      hasAgentId: Boolean(agentId),
      agentIdFull: agentId || 'MISSING',
      hasPhoneNumberId: Boolean(phoneNumberId),
      phoneNumberIdFull: phoneNumberId || 'MISSING',
      envVarsChecked: [
        'ELEVENLABS_API_KEY',
        'ELEVENLABS_AGENT_ID',
        'ELEVENLABS_AGENT_PHONE_NUMBER_ID',
        'ELEVENLABS_PHONE_NUMBER_ID',
        'TWILIO_PHONE_NUMBER_ID'
      ]
    };

    if (!apiKey || !agentId || !phoneNumberId) {
      return NextResponse.json({
        configStatus,
        error: 'Missing env vars — cannot test call'
      }, { status: 200 });
    }

    // Make the actual ElevenLabs call to a test number (use their own number)
    const testPayload = {
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: body.to_number || '+12022006578', // NexCall's own number as test
      conversation_initiation_client_data: {
        dynamic_variables: {
          lead_name: 'Debug Test',
          source: 'debug',
          page: 'debug'
        }
      }
    };

    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    let responseData;
    const rawText = await response.text();
    try { responseData = JSON.parse(rawText); } catch { responseData = { raw: rawText }; }

    return NextResponse.json({
      configStatus,
      elevenLabsStatus: response.status,
      elevenLabsStatusText: response.statusText,
      elevenLabsHeaders: Object.fromEntries(response.headers.entries()),
      elevenLabsResponse: responseData,
      payloadSent: { ...testPayload, agent_phone_number_id: phoneNumberId }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.slice(0, 500)
    }, { status: 500 });
  }
}
