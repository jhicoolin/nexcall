import { checkRateLimit } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';

// Uses Google Custom Search JSON API — official, compliant, requires key + CSE ID.
// Safe search is ON by default. No direct Google Images scraping.

export async function handleGoogle(interaction, res) {
  const sub   = interaction.data.options?.[0]?.name ?? 'search';
  const opts  = interaction.data.options?.[0]?.options ?? [];
  const query = opts.find((o) => o.name === 'query')?.value ?? '';
  const userId = interaction.member?.user?.id ?? interaction.user?.id ?? 'anon';

  if (!query.trim()) {
    return res.json({ type: 4, data: { content: 'Please provide a search query.', flags: EPHEMERAL } });
  }

  const limit = checkRateLimit(`google:${userId}`, 5, 60_000);
  if (!limit.allowed) {
    return res.json({ type: 4, data: { content: `Rate limit hit. Try again in ${limit.retryAfter}s.`, flags: EPHEMERAL } });
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId  = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    return res.json({
      type: 4,
      data: {
        embeds: [{
          title: 'Google Search — Not Configured',
          description: 'Add `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` to enable this command.\n\nGet them at [programmablesearchengine.google.com](https://programmablesearchengine.google.com).',
          color: 0xe63946,
        }],
        flags: EPHEMERAL,
      },
    });
  }

  try {
    const isImage = sub === 'image';
    const params = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: query,
      safe: 'active',
      num: '3',
      ...(isImage ? { searchType: 'image' } : {}),
    });

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!response.ok) throw new Error(`Google API ${response.status}`);
    const data = await response.json();

    const items = data.items ?? [];
    if (!items.length) {
      return res.json({ type: 4, data: { content: `No results found for **${query}**.`, flags: EPHEMERAL } });
    }

    if (isImage) {
      const top = items[0];
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: `🔍  Image: ${query}`,
            url: top.image?.contextLink ?? top.link,
            image: { url: top.link },
            description: `Source: [${top.displayLink}](${top.image?.contextLink ?? top.link})`,
            color: 0xe63946,
            footer: { text: 'Google Custom Search • Safe Search ON • Bad Genetics HQ' },
          }],
          flags: EPHEMERAL,
        },
      });
    }

    const fields = items.slice(0, 3).map((item) => ({
      name: item.title.slice(0, 100),
      value: `${item.snippet?.slice(0, 150) ?? ''}\n[${item.displayLink}](${item.link})`,
      inline: false,
    }));

    return res.json({
      type: 4,
      data: {
        embeds: [{
          title: `🔍  Search: ${query}`,
          color: 0xe63946,
          fields,
          footer: { text: 'Google Custom Search • Safe Search ON • Bad Genetics HQ' },
        }],
        flags: EPHEMERAL,
      },
    });
  } catch (err) {
    console.error('Google search error:', err);
    return res.json({ type: 4, data: { content: 'Search failed. Try again in a moment.', flags: EPHEMERAL } });
  }
}
