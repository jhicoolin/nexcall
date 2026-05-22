// Combined competitor watch — posts to 👀┃competitor-watch
// Source: Reddit public JSON API (official endpoint, proper User-Agent, source attribution)

const UA = 'BadGenesBot/1.0 (community research; contact@badgenes.com)';

const BRANDS = [
  { name: 'Gymshark',    query: 'Gymshark',    sub: 'streetwear' },
  { name: 'YoungLA',     query: 'YoungLA',     sub: 'streetwear' },
  { name: 'Alphalete',   query: 'Alphalete',   sub: 'fitness' },
  { name: 'Lululemon',   query: 'Lululemon',   sub: 'fitness' },
  { name: 'Under Armour',query: 'Under Armour',sub: 'running' },
];

function timeAgo(utc) {
  const m = Math.floor((Date.now() / 1000 - utc) / 60);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

async function searchBrand(brand) {
  try {
    const url = `https://www.reddit.com/r/${brand.sub}/search.json?q=${encodeURIComponent(brand.query)}&sort=new&limit=2&restrict_sr=1`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children ?? []).map((c) => ({
      title: c.data.title.slice(0, 80),
      url:   `https://reddit.com${c.data.permalink}`,
      age:   timeAgo(c.data.created_utc),
      score: c.data.score,
    }));
  } catch { return []; }
}

export async function fetchAndBuildCompetitorWatch() {
  const results = await Promise.all(BRANDS.map((b) => searchBrand(b)));

  const fields = BRANDS.map((b, i) => {
    const posts = results[i];
    return {
      name: b.name,
      value: posts.length
        ? posts.map((p) => `• [${p.title}](${p.url}) — ${p.age}`).join('\n')
        : 'No recent posts.',
      inline: false,
    };
  });

  return {
    embeds: [{
      title: '👀  Competitor Watch',
      description: 'Recent public Reddit mentions. Source attribution included.',
      color: 0xe63946,
      fields,
      footer: { text: 'Public signals only. Not financial advice. Source: Reddit • Bad Genetics HQ' },
      timestamp: new Date().toISOString(),
    }],
  };
}
