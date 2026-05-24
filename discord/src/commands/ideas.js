import OpenAI from 'openai';
import { checkRateLimit } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';
import { editOriginalResponse } from '../discordApi.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_CHAT_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.AI_CHAT_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a creative strategist for Bad Genetics — a bold fitness and lifestyle brand.

Generate actionable, original ideas across these categories:
- Marketing campaigns and content hooks
- Community challenges for Discord or social
- Drop strategies and product launch angles
- Competitor vulnerability analysis (public signals only)
- Merch concepts and creative pivots

Output format: 5–8 bullet points. Each bullet is one actionable idea — specific, punchy, no fluff.
If a topic is provided, focus on it. Otherwise spread ideas across categories.`;

const FALLBACK_IDEAS = [
  '**"Bad Genetics, Built Anyway"** — run a 30-day transformation challenge. Winners get exclusive gear.',
  '**Drop countdown series** — 7-day teaser drip on social/Discord before each launch to build hype.',
  '**Customer fit-pic Fridays** — weekly community post in #fit-pics with server perks for best photo.',
  '**Founder story thread** — raw, unfiltered origin story content outperforms polished ads right now.',
  '**Collab with micro-influencers** (10k–100k) in niche fitness verticals — better ROI than macro.',
  '**Limited colorways** — one exclusive color per drop, retired forever. Drives urgency and resale value.',
  '**Community leaderboard rewards** — tie top XP earners to monthly merch giveaways.',
  '**"Train Ugly" campaign** — embrace the anti-aesthetic, raw training aesthetic. Differentiate from polished competitors.',
];

export async function handleIdeas(interaction, res) {
  const topic = interaction.data.options?.find((o) => o.name === 'topic')?.value ?? null;
  const userId = interaction.member?.user?.id ?? interaction.user?.id ?? 'anon';
  const token = interaction.token;

  const limit = checkRateLimit(`ideas:${userId}`, 3, 60_000);
  if (!limit.allowed) {
    return res.json({
      type: 4,
      data: { content: `Rate limit hit. Try again in ${limit.retryAfter}s.`, flags: EPHEMERAL },
    });
  }

  if (!OPENAI_API_KEY) {
    return res.json({
      type: 4,
      data: {
        embeds: [
          {
            title: 'Marketing Ideas',
            description: FALLBACK_IDEAS.join('\n'),
            color: 0xe63946,
            footer: { text: 'Add OPENAI_API_KEY (or AI_CHAT_API_KEY) for AI-generated custom ideas.' },
          },
        ],
      },
    });
  }

  // Defer immediately to avoid Discord interaction timeout.
  res.json({ type: 5, data: { flags: EPHEMERAL } });

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    const userMessage = topic
      ? `Generate marketing and community ideas focused on: ${topic}`
      : 'Generate a diverse mix of marketing and community ideas for Bad Genetics.';

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const ideas = completion.choices[0]?.message?.content ?? FALLBACK_IDEAS.join('\n');

    await editOriginalResponse(token, {
      embeds: [
        {
          title: topic ? `Ideas — ${topic}` : 'Marketing Ideas',
          description: ideas,
          color: 0xe63946,
          footer: { text: 'Bad Genetics HQ • Genie' },
        },
      ],
    });
  } catch (err) {
    console.error('Ideas OpenAI error:', err);
    await editOriginalResponse(token, {
      embeds: [
        {
          title: 'Marketing Ideas',
          description: FALLBACK_IDEAS.join('\n'),
          color: 0xe63946,
          footer: { text: 'AI unavailable — showing curated ideas.' },
        },
      ],
    }).catch(() => {});
  }
}
