import { EPHEMERAL } from '../permissions.js';

const DISCLAIMER = '\n\n> **Not financial advice.** All information is for informational and educational purposes only.';

const COMPETITOR_INFO = `**Lululemon (LULU)** — Public. NYSE listed.
Track via: SEC EDGAR, earnings calls, press releases, official social.

**Under Armour (UA/UAA)** — Public. NYSE listed.
Track via: SEC EDGAR, earnings calls, press releases.

**Gymshark** — Private (UK). No public financials.
Public signals: social media drops, newsletter releases, influencer campaigns, PR announcements, Google Trends.

**YoungLA** — Private (US). No public financials.
Public signals: social drops, collab announcements, brand partnerships, search trend spikes.

> *Only track what's publicly available. Do not scrape or access non-public data.*`;

const MARKETING_IDEAS = `**Current public trend signals to watch:**
- Short-form video content dominating fitness discovery (Reels, Shorts, TikTok)
- "Raw and unfiltered" brand authenticity outperforming polished ads
- Community challenges driving organic growth
- Limited drops creating urgency and secondary market interest
- Founder-led content building trust faster than brand accounts

**Content angles for Bad Genetics:**
- Before/after transformation stories from real customers
- Behind-the-scenes of drop creation
- "Bad Genetics, built anyway" — motivational positioning
- Customer fit-pic contests with server prizes
- Weekly fitness challenges tied to drops`;

export function handleMarket(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? '';

  switch (sub) {
    case 'crypto':
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Crypto Overview',
              description:
                'Live crypto data integration is planned for Phase 2.\n\nWatch <#crypto-watch> for team-curated updates.' + DISCLAIMER,
              color: 0xe63946,
              footer: { text: 'Bad Genetics HQ • Market Intel' },
            },
          ],
          flags: EPHEMERAL,
        },
      });

    case 'stock':
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Apparel Stock Watch',
              description:
                '**Tracked tickers:**\n`UA` / `UAA` — Under Armour (NYSE)\n`LULU` — Lululemon Athletica (NASDAQ)\n\nLive price integration planned for Phase 2. Check [Yahoo Finance](https://finance.yahoo.com) or [Google Finance](https://www.google.com/finance) for current data.' +
                DISCLAIMER,
              color: 0xe63946,
              footer: { text: 'Bad Genetics HQ • Market Intel' },
            },
          ],
          flags: EPHEMERAL,
        },
      });

    case 'competitor':
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Competitor Brand Signals',
              description: COMPETITOR_INFO + DISCLAIMER,
              color: 0xe63946,
              footer: { text: 'Public signals only. No scraping or ToS violations.' },
            },
          ],
          flags: EPHEMERAL,
        },
      });

    case 'marketing':
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Marketing Intelligence',
              description: MARKETING_IDEAS,
              color: 0xe63946,
              footer: { text: 'Bad Genetics HQ • Market Intel' },
            },
          ],
          flags: EPHEMERAL,
        },
      });

    default:
      return res.json({ type: 4, data: { content: 'Unknown market subcommand.', flags: EPHEMERAL } });
  }
}
