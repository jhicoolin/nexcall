import { NextResponse } from "next/server";
import {
  getScenarioTtsScript,
  huggingFaceScenarioModels,
  isHuggingFaceScenarioId
} from "@/lib/huggingface-voice-lab";
import { cleanIdentifier, readJsonObject, validationResponse } from "@/lib/security";

type TtsPayload = {
  text?: unknown;
  scenarioId?: unknown;
};

function getScenarioEnvName(scenarioId: string) {
  return `HUGGINGFACE_TTS_MODEL_${scenarioId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

async function requestHuggingFaceSpeech(model: string, token: string, payload: object) {
  return fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await readJsonObject(request, 1500);
  } catch (error) {
    return validationResponse(error);
  }

  const scenarioId = body.scenarioId;

  if (typeof body.text === "string" && body.text.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Custom TTS text is disabled. Humanized TTS is only available for approved scenario demos."
      },
      { status: 400 }
    );
  }

  if (!isHuggingFaceScenarioId(scenarioId)) {
    return NextResponse.json({ ok: false, error: "Unknown scenario." }, { status: 400 });
  }

  const token = process.env.HUGGINGFACE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Hugging Face TTS is not configured yet. Add HUGGINGFACE_API_TOKEN or upload MP3 clips in public/audio."
      },
      { status: 503 }
    );
  }

  const text = getScenarioTtsScript(scenarioId);
  const model =
    cleanIdentifier(
      process.env[getScenarioEnvName(scenarioId)] ||
        process.env.HUGGINGFACE_TTS_MODEL ||
        huggingFaceScenarioModels[scenarioId],
      160
    );

  try {
    let response = await requestHuggingFaceSpeech(model, token, {
      inputs: text,
      parameters: {
        return_full_text: false
      }
    });

    if (!response.ok && response.status === 400) {
      response = await requestHuggingFaceSpeech(model, token, {
        text_inputs: text
      });
    }

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        {
          ok: false,
          error: message || `Hugging Face TTS request failed for ${model}.`
        },
        { status: 502 }
      );
    }

    const audio = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/wav";

    return new NextResponse(audio, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-HuggingFace-Model": model
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach Hugging Face TTS. Use uploaded MP3 clips as the launch fallback." },
      { status: 502 }
    );
  }
}
