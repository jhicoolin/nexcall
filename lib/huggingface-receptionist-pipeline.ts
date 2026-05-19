import type { ClientConfig } from "@/lib/client-directory";
import { extractBookingIntent, maybeFireBookingWebhook } from "@/lib/booking-intent";
import { mulawBase64ToWavBuffer, wavArrayBufferToMulawBase64 } from "@/lib/audio-codecs";
import { cleanText } from "@/lib/security";
import { buildMasterReceptionistPrompt } from "@/services/receptionist/master-system-prompt";
import { evaluateConversationSafety } from "@/services/receptionist/safety-policy";

export type ReceptionistTurnInput = {
  client: ClientConfig;
  transcript?: string;
  audioMulawBase64?: string;
  callerPhone?: string;
  callSid?: string;
};

type HuggingFaceGeneration = Array<{ generated_text?: string }> | { generated_text?: string; error?: string };

function getToken() {
  return process.env.HUGGINGFACE_API_TOKEN || "";
}

async function hfFetch(model: string, init: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractGeneratedText(result: HuggingFaceGeneration) {
  if (Array.isArray(result)) {
    return cleanText(result[0]?.generated_text, 1200);
  }

  return cleanText(result.generated_text, 1200);
}

/**
 * Converts Twilio inbound mu-law audio into text using the tenant's STT model.
 *
 * Twilio sends raw base64 mu-law chunks. Hugging Face ASR models are more likely
 * to accept WAV, so the audio is converted into an 8 kHz PCM WAV buffer before
 * it is sent to the Inference API.
 */
export async function transcribeTwilioAudio(client: ClientConfig, audioMulawBase64: string) {
  const token = getToken();

  if (!token) {
    throw new Error("HUGGINGFACE_API_TOKEN is required for speech transcription.");
  }

  const model = client.speechToTextModelId || process.env.HUGGINGFACE_STT_MODEL || "openai/whisper-large-v3-turbo";
  const wav = mulawBase64ToWavBuffer(audioMulawBase64);
  const response = await hfFetch(
    model,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "audio/wav"
      },
      body: wav
    },
    12000
  );

  const result = (await response.json()) as { text?: string; error?: string };

  if (!response.ok) {
    throw new Error(result.error || `Hugging Face ASR failed for ${model}.`);
  }

  return cleanText(result.text, 1000);
}

/**
 * Generates the receptionist's text answer with the tenant-specific system
 * prompt injected into the model context.
 */
export async function generateReceptionistText(client: ClientConfig, transcript: string) {
  const token = getToken();

  if (!token) {
    return "I can help with that. May I get your name and the best phone number for the team?";
  }

  const model = client.llmModelId || process.env.HUGGINGFACE_LLM_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";
  const response = await hfFetch(
    model,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: buildMasterReceptionistPrompt({ client, transcript, channel: "voice" }),
        parameters: {
          max_new_tokens: 90,
          temperature: 0.25,
          return_full_text: false
        }
      })
    },
    10000
  );
  const result = (await response.json()) as HuggingFaceGeneration;

  if (!response.ok) {
    return "I can help with that. Let me get a few details so the team can follow up correctly.";
  }

  return (
    extractGeneratedText(result)
      .replace(/^Receptionist:\s*/i, "")
      .split("\n")[0]
      .trim() || "I can help with that. What name should I put on the request?"
  );
}

/**
 * Generates Twilio-ready audio from the tenant's configured Hugging Face TTS
 * model. The model must return PCM WAV audio so the converter can strip the WAV
 * container and send raw 8 kHz mu-law back to Twilio.
 */
export async function generateTwilioMulawSpeech(client: ClientConfig, text: string) {
  const token = getToken();

  if (!token) {
    return "";
  }

  const response = await hfFetch(
    client.huggingFaceModelId,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          return_full_text: false
        }
      })
    },
    12000
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Hugging Face TTS failed for ${client.huggingFaceModelId}.`);
  }

  const audio = await response.arrayBuffer();
  return wavArrayBufferToMulawBase64(audio);
}

/**
 * Complete backend turn processor for a live phone call.
 *
 * Data flow:
 * 1. Accept either already-transcribed speech or Twilio mu-law audio.
 * 2. Resolve speech into text.
 * 3. Generate a tenant-specific receptionist answer using the client's prompt.
 * 4. Detect booking intent and POST to that client's calendar webhook.
 * 5. Generate tenant-specific TTS and convert it to Twilio's media format.
 */
export async function runReceptionistTurn({
  client,
  transcript,
  audioMulawBase64,
  callerPhone,
  callSid
}: ReceptionistTurnInput) {
  const cleanTranscript =
    cleanText(transcript, 1000) ||
    (audioMulawBase64 ? await transcribeTwilioAudio(client, audioMulawBase64) : "");

  if (!cleanTranscript) {
    return {
      transcript: "",
      text: "I am here. Could you say that one more time?",
      audioMulawBase64: "",
      booking: { detected: false }
    };
  }

  const safety = evaluateConversationSafety(cleanTranscript);

  if (!safety.allowed) {
    return {
      transcript: cleanTranscript,
      text: safety.signOff || "I apologize, but I have to end this call. Have a good day.",
      audioMulawBase64: "",
      booking: { detected: false },
      terminated: true,
      safetyReason: safety.reason
    };
  }

  const text = await generateReceptionistText(client, cleanTranscript);
  const booking = extractBookingIntent({
    userText: cleanTranscript,
    assistantText: text,
    callerPhone
  });
  const bookingResult = await maybeFireBookingWebhook({ client, intent: booking, callSid });
  const audio = await generateTwilioMulawSpeech(client, text);

  return {
    transcript: cleanTranscript,
    text,
    audioMulawBase64: audio,
    booking: {
      ...booking,
      webhookFired: bookingResult.fired
    }
  };
}
