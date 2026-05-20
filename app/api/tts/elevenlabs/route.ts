import { NextResponse } from "next/server";
import { getScenarioTtsScript, isNexCallScenarioId } from "@/lib/nexcall-voice-demos";
import { cleanIdentifier, readJsonObject, validationResponse } from "@/lib/security";

function getScenarioVoiceId(scenarioId: string) {
  const scenarioKey = scenarioId.toUpperCase().replace(/[^A-Z0-9]/g, "_");

  return (
    process.env[`ELEVENLABS_VOICE_ID_${scenarioKey}`] ||
    process.env.ELEVENLABS_DEMO_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID ||
    ""
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await readJsonObject(request, 2000);
  } catch (error) {
    return validationResponse(error);
  }

  const scenarioId = cleanIdentifier(body.scenarioId, 40);

  if (!isNexCallScenarioId(scenarioId)) {
    return NextResponse.json({ ok: false, error: "Unknown voice demo scenario." }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = getScenarioVoiceId(scenarioId);

  if (!apiKey || !voiceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Voice preview is not available right now. Please try the real demo call instead."
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: getScenarioTtsScript(scenarioId),
        model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.48,
          similarity_boost: 0.78,
          style: 0.18,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      console.error("Voice preview generation failed", {
        status: response.status,
        scenarioId
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Voice preview is not available right now. Please try the real demo call instead."
        },
        { status: response.status }
      );
    }

    const audio = await response.arrayBuffer();

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Voice preview is not available right now. Please try the real demo call instead." },
      { status: 502 }
    );
  }
}
