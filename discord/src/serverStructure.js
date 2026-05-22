// Clean, premium, reduced BadGenes HQ server layout.
// postEmbed: bot posts a specific embed after channel creation.
// readonly: @everyone can view but not send.
// staffOnly: hidden from @everyone, visible to staff roles only.

export const SERVER_STRUCTURE = [
  {
    category: '【👋】START HERE',
    channels: [
      { name: '✅┃rules',     type: 0, readonly: true,  postEmbed: 'rules' },
      { name: '👋┃welcome',   type: 0, readonly: true,  postEmbed: 'welcome' },
      { name: '🎭┃get-roles', type: 0, readonly: true,  postEmbed: 'roles' },
      { name: '❓┃support',   type: 0 },
    ],
  },
  {
    category: '【🧬】BADGENES',
    channels: [
      { name: '📢┃announcements', type: 0, readonly: true },
      { name: '🔥┃drops',         type: 0, readonly: true },
      { name: '🛒┃shop',          type: 0, readonly: true, postEmbed: 'shop' },
      { name: '🧢┃fit-pics',      type: 0 },
      { name: '🌄┃scenery',       type: 0 },
    ],
  },
  {
    category: '【💬】COMMUNITY',
    channels: [
      { name: '💬┃general',      type: 0 },
      { name: '🎧┃media',        type: 0 },
      { name: '😂┃memes',        type: 0 },
      { name: '🤖┃bot-commands', type: 0 },
      { name: '🎮┃minigames',    type: 0 },
    ],
  },
  {
    category: '【💪】TRAINING',
    channels: [
      { name: '💪┃training',   type: 0 },
      { name: '📸┃form-check', type: 0 },
      { name: '🥗┃nutrition',  type: 0 },
      { name: '📅┃routines',   type: 0 },
      { name: '📈┃progress',   type: 0 },
    ],
  },
  {
    category: '【📊】INTEL',
    channels: [
      { name: '📈┃market-watch',    type: 0, readonly: true },
      { name: '👀┃competitor-watch',type: 0, readonly: true },
      { name: '💡┃marketing-ideas', type: 0, readonly: true },
    ],
  },
  {
    category: '【🏆】RANKS',
    channels: [
      { name: '🧬┃level-up',    type: 0, readonly: true },
      { name: '🏆┃leaderboard', type: 0, readonly: true },
      { name: '🎁┃rewards',     type: 0, readonly: true },
    ],
  },
  {
    category: '【🎧】VOICE',
    channels: [
      { name: '🔊 Lounge',     type: 2 },
      { name: '🎵 Music',      type: 2 },
      { name: '🧠 Grind Room', type: 2 },
    ],
  },
  {
    category: '【🛡️】STAFF',
    staffOnly: true,
    channels: [
      { name: '🛡️┃staff-chat',      type: 0, staffOnly: true },
      { name: '🧾┃mod-log',          type: 0, staffOnly: true },
      { name: '⚙️┃admin-commands',   type: 0, staffOnly: true },
    ],
  },
];
