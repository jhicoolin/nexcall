import { checkRateLimit } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';

// Grailed does not have an official public API.
// This command generates a safe Grailed search link and style guidance.
// No scraping, no unauthorized access.

const STYLE_GUIDE = `**BadGenetics Aesthetic:**
Dark gymwear • Compression sets • Oversized tees • Cargo pants • Vintage athletic gear • Street-gym fits • Monochrome • Technical fabrics`;

const BRANDS_TO_WATCH = [
  'Nike ACG', 'Lululemon', 'Gymshark', 'Fear of God Athletics',
  'Represent Clothing', 'Stone Island', 'Arc\'teryx', 'Salehe Bembury',
  'New Balance', 'Adidas Originals', 'Rick Owens DRKSHDW',
];

export function handleGrailed(interaction, res) {
  const sub   = interaction.data.options?.[0]?.name ?? 'search';
  const opts  = interaction.data.options?.[0]?.options ?? [];
  const query = opts.find((o) => o.name === 'query')?.value ?? '';
  const userId = interaction.member?.user?.id ?? 'anon';

  const limit = checkRateLimit(`grailed:${userId}`, 5, 60_000);
  if (!limit.allowed) {
    return res.json({ type: 4, data: { content: `Rate limit. Try again in ${limit.retryAfter}s.`, flags: EPHEMERAL } });
  }

  if (sub === 'search') {
    if (!query.trim()) {
      return res.json({ type: 4, data: { content: 'Provide a search query. Example: `/grailed search cargo pants`', flags: EPHEMERAL } });
    }

    const encoded = encodeURIComponent(query);
    const grailedUrl = `https://www.grailed.com/shop/men?query=${encoded}`;

    return res.json({
      type: 4,
      data: {
        embeds: [{
          title: `🔎  Grailed — "${query}"`,
          description: `[Search Grailed →](${grailedUrl})\n\n${STYLE_GUIDE}`,
          color: 0xe63946,
          fields: [
            { name: 'Brands to Watch', value: BRANDS_TO_WATCH.slice(0, 6).join(' • '), inline: false },
            { name: 'Style Tips', value: 'Look for: dark colorways, oversized fits, technical fabric, athletic cuts. Skip: loud logos, bright colors unless vintage.', inline: false },
          ],
          footer: { text: 'BadGenetics HQ • Grailed Search — shop in 🔎┃grailed-search' },
        }],
        flags: EPHEMERAL,
      },
    });
  }

  if (sub === 'inspo') {
    const random = BRANDS_TO_WATCH[Math.floor(Math.random() * BRANDS_TO_WATCH.length)];
    const encoded = encodeURIComponent(random);
    const grailedUrl = `https://www.grailed.com/shop/men?query=${encoded}`;

    return res.json({
      type: 4,
      data: {
        embeds: [{
          title: '👟  Style Inspo',
          description: `Today's find angle: **${random}**\n\n[Search on Grailed →](${grailedUrl})\n\n${STYLE_GUIDE}`,
          color: 0xe63946,
          footer: { text: 'Bad Genetics HQ • Fashion' },
        }],
        flags: EPHEMERAL,
      },
    });
  }

  return res.json({ type: 4, data: { content: 'Unknown grailed subcommand.', flags: EPHEMERAL } });
}
