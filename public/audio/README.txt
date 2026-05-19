Put premium demo voice clips here before launch.

Recommended filenames:

appointment-scheduling.mp3
lead-qualification.mp3
restaurant-concierge.mp3
customer-support.mp3
ai-ivr.mp3
legal-intake.mp3

Then set these in .env.local:

NEXT_PUBLIC_DEMO_AUDIO_APPOINTMENT_URL="/audio/appointment-scheduling.mp3"
NEXT_PUBLIC_DEMO_AUDIO_LEAD_URL="/audio/lead-qualification.mp3"
NEXT_PUBLIC_DEMO_AUDIO_RESTAURANT_URL="/audio/restaurant-concierge.mp3"
NEXT_PUBLIC_DEMO_AUDIO_SUPPORT_URL="/audio/customer-support.mp3"
NEXT_PUBLIC_DEMO_AUDIO_IVR_URL="/audio/ai-ivr.mp3"
NEXT_PUBLIC_DEMO_AUDIO_LEGAL_URL="/audio/legal-intake.mp3"

If these values are blank, the website can optionally try /api/tts/huggingface when:

NEXT_PUBLIC_ENABLE_HF_TTS_DEMOS="true"
HUGGINGFACE_API_TOKEN="your_token"

The Hugging Face route generates audio from approved server-side scenario scripts only.
It does not generate live chat audio or arbitrary visitor text.

For public launch, uploaded MP3 clips are still preferred because they load faster and sound consistent for every visitor.
If Hugging Face TTS is disabled or fails, the website uses the best available browser speech voice.
