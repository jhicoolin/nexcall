import { EPHEMERAL } from '../permissions.js';

// Music commands are Phase 2 — requires an always-on worker (Railway/Render/Fly.io).
// Voice playback via the Discord voice gateway cannot run on Vercel serverless functions.
//
// COMPLIANCE NOTE:
// Direct ripping or downloading of YouTube, SoundCloud, or Spotify audio streams is
// intentionally NOT implemented. This bot does not bypass DRM, circumvent platform
// restrictions, or download copyrighted audio without authorization.
// Phase 2 will support legal playback integrations only.

const PHASE2_NOTE = '> **Phase 2 feature.** Music requires an always-on worker (Railway/Render).\n> The bot cannot stream audio from Vercel serverless functions.';

const LEGAL_NOTE = '> Music playback uses legal, compliant sources only. No ripping, no DRM bypass.';

export function handleMusic(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'nowplaying';

  const responses = {
    play: {
      title: '🎵 Music — Play',
      description: `Submit a link to queue a track.\n\n${PHASE2_NOTE}\n\n${LEGAL_NOTE}`,
    },
    queue: {
      title: '📋 Music — Queue',
      description: `View the current queue.\n\n${PHASE2_NOTE}`,
    },
    pause: {
      title: '⏸️ Music — Pause',
      description: PHASE2_NOTE,
    },
    resume: {
      title: '▶️ Music — Resume',
      description: PHASE2_NOTE,
    },
    skip: {
      title: '⏭️ Music — Skip',
      description: PHASE2_NOTE,
    },
    stop: {
      title: '⏹️ Music — Stop',
      description: PHASE2_NOTE,
    },
    volume: {
      title: '🔊 Music — Volume',
      description: PHASE2_NOTE,
    },
    nowplaying: {
      title: '🎵 Music — Now Playing',
      description: `Nothing is playing.\n\n${PHASE2_NOTE}`,
    },
  };

  const r = responses[sub] ?? responses.nowplaying;

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: r.title,
          description: r.description,
          color: 0xe63946,
          footer: { text: 'Bad Genetics HQ • Genie — Phase 2 music system' },
        },
      ],
      flags: EPHEMERAL,
    },
  });
}
