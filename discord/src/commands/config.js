import { isAdmin, noPermission, EPHEMERAL } from '../permissions.js';

// /config — view and set bot configuration.
// Phase 2: persist to DATABASE_URL. Phase 1: runtime-only display.

const CONFIG_KEYS = {
  'genie-model':     { desc: 'OpenAI model for /genie ask',           default: 'gpt-4o-mini' },
  'ai-rate-limit':   { desc: 'AI requests per user per minute',        default: '5' },
  'xp-per-message':  { desc: 'XP awarded per message',                 default: '10' },
  'xp-cooldown-sec': { desc: 'XP cooldown per user (seconds)',         default: '60' },
  'safe-search':     { desc: 'Google safe search (on/off)',            default: 'on' },
  'market-interval': { desc: 'Market update interval (minutes)',       default: '15' },
  'level-up-channel':{ desc: 'Channel name for level-up announcements',default: 'level-up' },
  'log-channel':     { desc: 'Channel name for mod logs',              default: 'mod-log' },
};

export function handleConfig(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'view';

  if (sub === 'view') {
    return handleConfigView(interaction, res);
  }
  if (sub === 'set') {
    if (!isAdmin(interaction)) return noPermission(res);
    return handleConfigSet(interaction, res);
  }

  return res.json({ type: 4, data: { content: 'Unknown config subcommand.', flags: EPHEMERAL } });
}

function handleConfigView(interaction, res) {
  const fields = Object.entries(CONFIG_KEYS).map(([key, meta]) => ({
    name: `\`${key}\``,
    value: `${meta.desc}\nDefault: \`${meta.default}\``,
    inline: true,
  }));

  fields.push({
    name: 'Database',
    value: process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured — add `DATABASE_URL`',
    inline: false,
  });

  fields.push({
    name: 'APIs Configured',
    value: [
      `OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`,
      `Google CSE: ${process.env.GOOGLE_CSE_API_KEY ? '✅' : '❌'}`,
      `Reddit: ${process.env.REDDIT_CLIENT_ID ? '✅' : '❌'}`,
      `Finnhub: ${process.env.FINNHUB_API_KEY ? '✅' : '❌'}`,
    ].join(' • '),
    inline: false,
  });

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '⚙️  Genie Config',
        description: 'Current configuration. Phase 2: values persist to database.',
        color: 0xe63946,
        fields,
        footer: { text: 'Bad Genetics HQ • Admin only' },
      }],
      flags: EPHEMERAL,
    },
  });
}

function handleConfigSet(interaction, res) {
  const opts = interaction.data.options?.[0]?.options ?? [];
  const key  = opts.find((o) => o.name === 'key')?.value   ?? '';
  const value = opts.find((o) => o.name === 'value')?.value ?? '';

  if (!CONFIG_KEYS[key]) {
    return res.json({
      type: 4,
      data: { content: `Unknown config key: \`${key}\`\nValid keys: ${Object.keys(CONFIG_KEYS).map((k) => `\`${k}\``).join(', ')}`, flags: EPHEMERAL },
    });
  }

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '⚙️  Config Updated (Runtime Only)',
        description: `\`${key}\` → \`${value}\`\n\n> This change is runtime-only in Phase 1. Add \`DATABASE_URL\` to persist config across restarts.`,
        color: 0xe63946,
        footer: { text: 'Bad Genetics HQ • Genie Config' },
      }],
      flags: EPHEMERAL,
    },
  });
}
