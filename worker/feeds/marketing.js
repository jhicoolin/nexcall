// Generates rotating marketing intelligence for the marketing-ideas,
// vulnerabilities, and creative-lab channels using OpenAI.
// Falls back to curated static content if OPENAI_API_KEY is not set.

const MARKETING_POOL = [
  '**Drop countdown series** — 7-day teaser drip before each launch. Builds anticipation without giving it away.',
  '**Customer fit-pic repost** — reshare customer photos (with permission) to #fit-pics weekly. Social proof.',
  '**"Train Ugly" campaign** — raw, unfiltered training content. Anti-aesthetic. Differentiates from polished competitors.',
  '**Limited colorway drops** — one exclusive color per drop, retired forever. Drives urgency and resale interest.',
  '**Micro-influencer outreach (10k–100k)** — better ROI than macro. Find niche fitness creators, not just size.',
  '**Community challenge** — 30-day challenge tied to a drop. Winners get product. Generates organic content.',
  '**Founder story content** — raw origin story performs better than polished brand ads right now.',
  '**Short-form reels** — show real training, not models. Authentic gets more saves and shares.',
  '**Weekly "locked in" member feature** — spotlight an active community member. Builds loyalty.',
  '**Drop prediction game** — let community guess next drop details. Creates hype before announcement.',
];

const VULNERABILITIES_POOL = [
  '**Gymshark** — Over-saturated influencer market. Their ambassador program is massive but feels inauthentic to hardcore athletes. Angle: real athletes, not influencers.',
  '**YoungLA** — Heavy LA/California aesthetic. Weak in East Coast and international markets. Angle: universal streetwear energy.',
  '**Lululemon** — Premium price fatigue. Customers are price-sensitive post-2023. Angle: comparable quality, community-first pricing.',
  '**Under Armour** — Identity crisis. Not streetwear, not premium, not budget. Angle: fill the performance-streetwear gap.',
  '**Nike** — Gen Z trust issues around authenticity and cultural appropriation. Angle: actually built from the culture.',
  '**General** — Most competitors are chasing trends instead of setting them. Opportunity: own a specific aesthetic niche deeply.',
];

const CREATIVE_POOL = [
  '**Drop theme idea** — "Blackout" collection: all black, no logos on the front. Logo only on tag. Minimalist.',
  '**Content hook** — "What your gym outfit says about you" — carousel post. High engagement potential.',
  '**Community challenge** — 21-day bodyweight challenge. Daily check-ins in #progress-checks. Prize: next drop discount.',
  '**Merch concept** — Embroidered patch collection. Customers add their own patches. Customizable and collectible.',
  '**Campaign angle** — "Built Different" isn\'t a slogan, it\'s a standard. Show what that actually looks like in the gym.',
  '**Collab angle** — Partner with a local underground gym or fight gym. Authentic credibility.',
  '**Launch pivot** — Pre-order model for limited drops. Gauge demand before production. Lower risk.',
  '**Content series** — "Bad Genetics Hall of Fame" — weekly spotlight on a real transformation story.',
];

function pickRotating(pool) {
  const idx = Math.floor(Date.now() / (5 * 60 * 1000)) % pool.length;
  return pool[idx];
}

export async function fetchAndBuildMarketing() {
  if (process.env.OPENAI_API_KEY) {
    return buildAiMarketing();
  }
  return buildStaticMarketing();
}

async function buildAiMarketing() {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [{
          role: 'system',
          content: 'You are a sharp marketing strategist for BadGenes (@badgenetic), a fitness streetwear brand. Generate 3 tactical marketing ideas. Each idea is one bold sentence. No fluff. Separate with newlines.',
        }, {
          role: 'user',
          content: 'Give me 3 fresh marketing angles for this week.',
        }],
      }),
    });
    const data = await res.json();
    const ideas = data.choices?.[0]?.message?.content ?? '';
    return buildMarketingEmbed(ideas, true);
  } catch {
    return buildStaticMarketing();
  }
}

function buildStaticMarketing() {
  return buildMarketingEmbed([
    pickRotating(MARKETING_POOL),
    pickRotating(VULNERABILITIES_POOL),
    pickRotating(CREATIVE_POOL),
  ].join('\n\n'), false);
}

function buildMarketingEmbed(content, aiGenerated) {
  return {
    embeds: [{
      title: '💡  Marketing Intelligence',
      description: content,
      color: 0xFCA311,
      footer: { text: `${aiGenerated ? 'AI-generated' : 'Curated'} • Bad Genetics HQ • Updated every 5 min` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function buildVulnerabilitiesEmbed() {
  return {
    embeds: [{
      title: '⚠️  Competitor Vulnerabilities',
      description: pickRotating(VULNERABILITIES_POOL),
      color: 0xe63946,
      footer: { text: 'Strategic analysis only. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function buildCreativeLabEmbed() {
  return {
    embeds: [{
      title: '🧪  Creative Lab',
      description: pickRotating(CREATIVE_POOL),
      color: 0x9B59B6,
      footer: { text: 'Rotating ideas. Bad Genetics HQ • Creative Lab' },
      timestamp: new Date().toISOString(),
    }],
  };
}
