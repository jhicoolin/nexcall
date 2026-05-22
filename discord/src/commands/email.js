import { EPHEMERAL } from '../permissions.js';

// STUB — requires opt_ins table (DATABASE_URL) and RESEND_API_KEY / SENDGRID_API_KEY.
// Phase 2: store opt-in state per user, trigger emails via Resend or SendGrid.
// Per Discord Developer Policy §7: never contact users outside Discord without explicit permission.
// Per Developer Terms §5: only contact users who have explicitly opted in.

export function handleEmail(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? '';

  switch (sub) {
    case 'optin':
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Email Opt-In',
              description:
                'Email subscriptions are coming in Phase 2.\n\nWhen enabled, you\'ll be able to receive weekly workout routines and drop alerts — only if you explicitly opt in.',
              color: 0xe63946,
              footer: { text: 'We will never email you without your permission.' },
            },
          ],
          flags: EPHEMERAL,
        },
      });

    case 'optout':
      return res.json({
        type: 4,
        data: {
          content: 'Email opt-out is coming in Phase 2. No emails are being sent yet.',
          flags: EPHEMERAL,
        },
      });

    case 'routine':
    case 'weekly':
      return res.json({
        type: 4,
        data: {
          content:
            'Email routines are a Phase 2 feature. Use `/routine` now for instant workout plans.',
          flags: EPHEMERAL,
        },
      });

    default:
      return res.json({ type: 4, data: { content: 'Unknown email subcommand.', flags: EPHEMERAL } });
  }
}
