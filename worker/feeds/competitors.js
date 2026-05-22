// Source: Reddit public JSON API — official endpoint for public subreddit data.
// Per Reddit's Developer Terms, public content may be accessed with proper User-Agent.
// We read only public posts, add source attribution, and do not repost full content.
// Rate: 1 request per feed per 5 minutes — well within Reddit's limits.

const USER_AGENT = 'BadGenesBot/1.0 (community research; contact@badgenes.com)';

async function searchReddit(subreddit, query, limit = 5) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&restrict_sr=1`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children ?? []).map((c) => ({
      title: c.data.title.slice(0, 100),
      url:   `https://reddit.com${c.data.permalink}`,
      score: c.data.score,
      sub:   c.data.subreddit,
      age:   timeAgo(c.data.created_utc),
    }));
  } catch {
    return [];
  }
}

function timeAgo(utc) {
  const mins = Math.floor((Date.now() / 1000 - utc) / 60);
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export async function fetchAndBuildCompetitors() {
  const [gymshark, youngla, lulu, ua] = await Promise.all([
    searchReddit('streetwear', 'Gymshark', 3),
    searchReddit('streetwear', 'YoungLA', 3),
    searchReddit('fitness', 'Lululemon', 3),
    searchReddit('fitness', 'Under Armour', 3),
  ]);

  function buildField(label, posts) {
    if (!posts.length) return { name: label, value: 'No recent posts.', inline: false };
    return {
      name: label,
      value: posts.map((p) => `• [${p.title}](${p.url}) — ${p.age}`).join('\n'),
      inline: false,
    };
  }

  return {
    embeds: [{
      title: '👀  Competitor Drop Signals',
      description: 'Recent public Reddit mentions. Updated every 5 min.\n*Source: Reddit public posts. Summaries only — not full content reproduction.*',
      color: 0xe63946,
      fields: [
        buildField('Gymshark',     gymshark),
        buildField('YoungLA',      youngla),
        buildField('Lululemon',    lulu),
        buildField('Under Armour', ua),
      ],
      footer: { text: 'Public signals only. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function fetchAndBuildBrandRadar() {
  const [streetwear, drops, fitness] = await Promise.all([
    searchReddit('streetwear', 'drop', 4),
    searchReddit('Hypebeasts', 'drop', 3),
    searchReddit('fitness', 'brand', 3),
  ]);

  const all = [...streetwear, ...drops, ...fitness]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    embeds: [{
      title: '🧠  Brand Radar',
      description: 'Top trending streetwear and fitness content right now.',
      color: 0x9B59B6,
      fields: all.length
        ? [{ name: 'Trending', value: all.map((p) => `• [${p.title}](${p.url}) — r/${p.sub} • ${p.age}`).join('\n'), inline: false }]
        : [{ name: 'Status', value: 'Radar updating...', inline: false }],
      footer: { text: 'Source: Reddit public posts. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}
