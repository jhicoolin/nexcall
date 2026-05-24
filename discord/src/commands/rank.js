import { EPHEMERAL } from '../permissions.js';

// Phase 1 stub — full XP rank card requires DATABASE_URL + Phase 2 worker.

const LEVEL_THRESHOLDS = [
  { level: 100, name: 'Genetic Legend', xp: 75000 },
  { level: 50,  name: 'Inner Circle',   xp: 20000 },
  { level: 35,  name: 'BadGenetics Elite', xp: 9000 },
  { level: 20,  name: 'Locked In',      xp: 4000 },
  { level: 10,  name: 'Regular',        xp: 1500 },
  { level: 5,   name: 'Initiate',       xp: 500 },
];

export function handleRank(interaction, res) {
  const targetUser = interaction.data?.options?.find((o) => o.name === 'user')?.value ?? null;
  const userId  = interaction.member?.user?.id ?? interaction.user?.id;
  const subject = targetUser ? `<@${targetUser}>` : `<@${userId}>`;

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '🧬  Rank Card',
        description: `${subject}\n\nFull rank tracking requires the Phase 2 database.\nAdd \`DATABASE_URL\` (Supabase or Neon) to enable XP tracking.`,
        color: 0xe63946,
        fields: [
          {
            name: 'Level Roles',
            value: LEVEL_THRESHOLDS.map((t) => `**Lv. ${t.level}** — ${t.name} (${t.xp.toLocaleString()} XP)`).join('\n'),
            inline: false,
          },
          {
            name: 'Earn XP',
            value: 'Chat in any public channel. Cooldown prevents spam. Level-up messages post in 🤖┃bot-commands.',
            inline: false,
          },
        ],
        footer: { text: 'Bad Genetics HQ • Genie — Phase 2 XP system' },
      }],
      flags: EPHEMERAL,
    },
  });
}
