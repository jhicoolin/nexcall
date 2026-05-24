import { isAdmin, noPermission, EPHEMERAL } from '../permissions.js';

// /analytics — Discord-native admin dashboard.
// Phase 1: runtime counters. Phase 2: persistent DATABASE_URL analytics.

const startTime = Date.now();
const commandCounts = new Map();

export function trackCommand(name) {
  commandCounts.set(name, (commandCounts.get(name) ?? 0) + 1);
}

export function handleAnalytics(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);

  const sub = interaction.data.options?.[0]?.name ?? 'overview';

  if (sub === 'overview')  return handleOverview(interaction, res);
  if (sub === 'commands')  return handleCommands(interaction, res);
  if (sub === 'growth')    return handleGrowth(interaction, res);

  return res.json({ type: 4, data: { content: 'Unknown subcommand.', flags: EPHEMERAL } });
}

function handleOverview(_interaction, res) {
  const uptimeMs = Date.now() - startTime;
  const uptime = formatUptime(uptimeMs);
  const totalCommands = [...commandCounts.values()].reduce((a, b) => a + b, 0);

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '📊  Analytics Overview',
        color: 0xe63946,
        fields: [
          { name: 'Worker Uptime',    value: uptime,                             inline: true },
          { name: 'Commands Run',     value: String(totalCommands),              inline: true },
          { name: 'Database',         value: process.env.DATABASE_URL ? '✅ Connected' : '⚠️ Not set', inline: true },
          { name: 'APIs Active',      value: buildApiStatus(),                   inline: false },
          { name: 'Phase 2 Features', value: '`XP tracking` `leaderboard` `audit logs` `growth metrics` — require `DATABASE_URL`', inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • Admin Analytics' },
        timestamp: new Date().toISOString(),
      }],
      flags: EPHEMERAL,
    },
  });
}

function handleCommands(_interaction, res) {
  const sorted = [...commandCounts.entries()].sort((a, b) => b[1] - a[1]);

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '📊  Command Usage (This Session)',
        color: 0xe63946,
        description: sorted.length
          ? sorted.map(([cmd, count]) => `\`/${cmd}\` — ${count} use${count === 1 ? '' : 's'}`).join('\n')
          : 'No commands recorded yet.',
        footer: { text: 'Resets on restart. Add DATABASE_URL for persistent analytics.' },
      }],
      flags: EPHEMERAL,
    },
  });
}

function handleGrowth(_interaction, res) {
  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '📈  Growth Analytics',
        description: 'Growth metrics (member joins, message volume, XP trends) require `DATABASE_URL`.\n\nAdd Supabase or Neon to enable full growth tracking.',
        color: 0xe63946,
        footer: { text: 'Phase 2 feature — Bad Genetics HQ' },
      }],
      flags: EPHEMERAL,
    },
  });
}

function buildApiStatus() {
  const aiKeyConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.AI_CHAT_API_KEY);
  const aiModel = process.env.OPENAI_MODEL || process.env.AI_CHAT_MODEL || 'gpt-4o-mini';
  return [
    `OpenAI: ${aiKeyConfigured ? '✅' : '❌'}`,
    `AI Model: ${aiModel}`,
    `Google CSE: ${process.env.GOOGLE_CSE_API_KEY ? '✅' : '❌'}`,
    `Reddit: ${process.env.REDDIT_CLIENT_ID ? '✅' : '❌'}`,
    `Finnhub: ${process.env.FINNHUB_API_KEY ? '✅' : '❌'}`,
    `Database: ${process.env.DATABASE_URL ? '✅' : '❌'}`,
  ].join(' • ');
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}
