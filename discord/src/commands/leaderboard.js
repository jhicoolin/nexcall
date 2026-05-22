import { EPHEMERAL } from '../permissions.js';

// STUB — requires DATABASE_URL.
// Phase 2: query top 10 from users table ordered by xp DESC.

export function handleLeaderboard(_interaction, res) {
  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'XP Leaderboard',
          description:
            'Leaderboard is coming in Phase 2 once the database is connected.\n\nEarn XP by chatting, staying active, and participating in events.',
          color: 0xe63946,
          footer: { text: 'Bad Genetics HQ • Genie — Phase 2 feature' },
        },
      ],
      flags: EPHEMERAL,
    },
  });
}
