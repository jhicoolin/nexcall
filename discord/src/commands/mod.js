import { isAdmin, noPermission, EPHEMERAL } from '../permissions.js';

// Moderation framework — Phase 1 stubs.
// Phase 2: persistent warnings/bans via DATABASE_URL, DM notifications (opt-in only).

export function handleMod(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);

  const sub = interaction.data.options?.[0]?.name ?? 'help';
  const opts = interaction.data.options?.[0]?.options ?? [];

  const target  = opts.find((o) => o.name === 'user')?.value ?? null;
  const reason  = opts.find((o) => o.name === 'reason')?.value ?? 'No reason provided';

  switch (sub) {
    case 'warn':
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '⚠️  Warning Issued (Phase 1 Stub)',
            description: `<@${target}> would be warned.\nReason: ${reason}\n\n> Phase 2: persists to database with warning history and escalation.`,
            color: 0xFCA311,
            footer: { text: 'Bad Genetics HQ • Moderation' },
          }],
          flags: EPHEMERAL,
        },
      });

    case 'kick':
    case 'ban':
      return res.json({
        type: 4,
        data: {
          content: `/${sub} is a destructive action — use Discord's native moderation for now. Phase 2 will add bot-managed moderation with audit logs.`,
          flags: EPHEMERAL,
        },
      });

    case 'purge':
      return res.json({
        type: 4,
        data: {
          content: 'Purge requires Discord\'s Manage Messages permission and the gateway. Phase 2 feature via always-on worker.',
          flags: EPHEMERAL,
        },
      });

    default:
      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '🛡️  Moderation Commands',
            description: '`/mod warn` — issue a warning\n`/mod kick` — kick a member\n`/mod ban` — ban a member\n`/mod purge` — delete messages\n\nAll actions require **Admin** or **Moderator** role.',
            color: 0xe63946,
            footer: { text: 'Phase 2: full persistent moderation + audit logs.' },
          }],
          flags: EPHEMERAL,
        },
      });
  }
}
