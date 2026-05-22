import { EPHEMERAL } from '../permissions.js';

// STUB — requires DATABASE_URL (Postgres via Supabase or Neon)
// Phase 2: connect to xp_events + users tables to read real XP data.

const LEVEL_ROLES = [
  { level: 5, name: 'Initiate' },
  { level: 10, name: 'Regular' },
  { level: 20, name: 'Locked In' },
  { level: 35, name: 'BadGenes Elite' },
  { level: 50, name: 'Inner Circle' },
];

export function handleLevel(interaction, res) {
  const targetUser =
    interaction.data.options?.find((o) => o.name === 'user')?.value ?? null;
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const username = interaction.member?.user?.username ?? 'you';

  const isSelf = !targetUser || targetUser === userId;
  const subject = isSelf ? `<@${userId}>` : `<@${targetUser}>`;

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Level System',
          description: `${subject} — XP tracking is coming in Phase 2 once the database is connected.`,
          color: 0xe63946,
          fields: [
            {
              name: 'Level Roles',
              value: LEVEL_ROLES.map((r) => `**Level ${r.level}** — ${r.name}`).join('\n'),
              inline: false,
            },
            {
              name: 'Status',
              value: '`DATABASE_URL` required. Add Supabase or Neon to enable XP tracking.',
              inline: false,
            },
          ],
          footer: { text: 'Bad Genetics HQ • Genie' },
        },
      ],
      flags: EPHEMERAL,
    },
  });
}
