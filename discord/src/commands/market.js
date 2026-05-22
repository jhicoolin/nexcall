import { EPHEMERAL } from '../permissions.js';

const FIN_DISCLAIMER = '\n> **Not financial advice.** Informational only.';

const PUBLIC_TICKERS = [
  { name: 'Under Armour A',  symbol: 'UA',    link: 'https://finance.yahoo.com/quote/UA' },
  { name: 'Under Armour C',  symbol: 'UAA',   link: 'https://finance.yahoo.com/quote/UAA' },
  { name: 'Lululemon',       symbol: 'LULU',  link: 'https://finance.yahoo.com/quote/LULU' },
  { name: 'Nike',            symbol: 'NKE',   link: 'https://finance.yahoo.com/quote/NKE' },
  { name: 'Adidas (US ADR)', symbol: 'ADDYY', link: 'https://finance.yahoo.com/quote/ADDYY' },
  { name: 'On Holdings',     symbol: 'ONON',  link: 'https://finance.yahoo.com/quote/ONON' },
];

const PRIVATE_BRANDS = [
  { name: 'Gymshark',    signals: 'Social drops, influencer campaigns, public PRs, UK Companies House filings', ig: '@gymshark' },
  { name: 'YoungLA',     signals: 'Social drops, collab announcements, Google Trends, public ads', ig: '@youngla' },
  { name: 'Alphalete',   signals: 'Social posts, drop announcements, YouTube content', ig: '@alphalete' },
  { name: 'Rawgear',     signals: 'Social media, ambassador posts, public product launches', ig: '@rawgear' },
  { name: 'Darc Sport',  signals: 'Social media, drop posts, influencer partnerships', ig: '@darcsport' },
  { name: 'Oner Active', signals: 'Social media, newsletter, product launches', ig: '@oneractive' },
  { name: 'Set Active',  signals: 'Social media, limited drops, influencer campaigns', ig: '@setactive' },
];

export function handleMarket(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'crypto';
  const opts = interaction.data.options?.[0]?.options ?? [];
  const brandArg = opts.find((o) => o.name === 'brand')?.value ?? null;

  switch (sub) {
    case 'crypto':
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '₿  Crypto Overview',
            description: `Live crypto prices update automatically in 📈┃market-watch every 15 min via the worker.\n\nFor live data: [CoinGecko](https://coingecko.com) • [CoinMarketCap](https://coinmarketcap.com)${FIN_DISCLAIMER}`,
            color: 0xF7931A,
            footer: { text: 'Not financial advice. Bad Genetics HQ • Market Intel' },
          }],
          flags: EPHEMERAL,
        },
      });

    case 'stock':
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '📈  Apparel & Fitness Stocks',
            description: 'Tracked tickers:',
            color: 0x2ECC71,
            fields: PUBLIC_TICKERS.map((t) => ({
              name: `${t.name} (${t.symbol})`,
              value: `[View on Yahoo Finance](${t.link})`,
              inline: true,
            })),
            footer: { text: 'Not financial advice. Live prices in 📈┃market-watch via worker.' },
          }],
          flags: EPHEMERAL,
        },
      });

    case 'competitor': {
      const brand = brandArg
        ? PRIVATE_BRANDS.find((b) => b.name.toLowerCase().includes(brandArg.toLowerCase()))
        : null;

      if (brand) {
        return res.json({
          type: 4,
          data: {
            embeds: [{
              title: `👀  ${brand.name} — Competitor Intel`,
              color: 0xe63946,
              fields: [
                { name: 'Instagram',        value: brand.ig,      inline: true },
                { name: 'Public Signals',   value: brand.signals, inline: false },
                { name: 'BadGenes Angle',   value: 'Use `/ideas` to generate positioning plays against this brand.', inline: false },
              ],
              footer: { text: 'Public signals only. Not financial advice. Bad Genetics HQ' },
            }],
            flags: EPHEMERAL,
          },
        });
      }

      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '👀  Competitor Brand Intel',
            description: '**Public company filings (tracked):**\nUA, LULU, NKE, ADDYY, ONON via SEC EDGAR and Yahoo Finance.\n\n**Private brands (public signals only):**',
            color: 0xe63946,
            fields: PRIVATE_BRANDS.map((b) => ({
              name: b.name,
              value: `${b.ig}\nSignals: ${b.signals}`,
              inline: false,
            })),
            footer: { text: 'Public data only. Live updates in 👀┃competitor-watch via worker.' },
          }],
          flags: EPHEMERAL,
        },
      });
    }

    case 'marketing':
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '💡  Marketing Intel',
            description: 'Live marketing ideas and opportunities update in 💡┃marketing-ideas every 15 min.\n\nUse `/ideas` for on-demand AI-generated campaigns.',
            color: 0xFCA311,
            footer: { text: 'Bad Genetics HQ • Market Intel' },
          }],
          flags: EPHEMERAL,
        },
      });

    default:
      return res.json({ type: 4, data: { content: 'Unknown subcommand.', flags: EPHEMERAL } });
  }
}
