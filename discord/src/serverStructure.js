export const SERVER_STRUCTURE = [
  {
    category: '【👋】START',
    channels: [
      { name: '✅┃rules',   type: 0, readonly: true, postEmbed: 'rules' },
      { name: '👋┃welcome', type: 0, readonly: true, postEmbed: 'welcome' },
      { name: '🎭┃roles',   type: 0, readonly: true, postEmbed: 'roles' },
      { name: '❓┃support', type: 0 },
    ],
  },
  {
    category: '【🧬】BADGENETICS',
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
    ],
  },
  {
    category: '【💪】TRAINING',
    channels: [
      { name: '💪┃training',   type: 0 },
      { name: '📸┃form-check', type: 0 },
      { name: '🥗┃nutrition',  type: 0 },
      { name: '📅┃routines',   type: 0 },
    ],
  },
  {
    category: '【₿】CRYPTO',
    channels: [
      { name: '📈┃crypto-live',     type: 0, readonly: true },
      { name: '🚨┃crypto-alerts',   type: 0, readonly: true },
      { name: '🧠┃crypto-analysis', type: 0 },
      { name: '💬┃crypto-chat',     type: 0 },
    ],
  },
  {
    category: '【👕】FASHION',
    channels: [
      { name: '🔎┃grailed-search',   type: 0 },
      { name: '👟┃style-finds',      type: 0 },
      { name: '🧢┃badgenetics-fits', type: 0 },
    ],
  },
  {
    category: '【🛡️】STEPPIN HQ',
    staffOnly: true,
    channels: [
      { name: '🧠┃internal-strategy', type: 0, staffOnly: true },
      { name: '👀┃competitor-watch',  type: 0, staffOnly: true },
      { name: '💡┃marketing-plays',   type: 0, staffOnly: true },
      { name: '📊┃analytics',         type: 0, staffOnly: true },
      { name: '⚙️┃admin-commands',    type: 0, staffOnly: true },
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
];

// Channels to archive (moved to private 【📦】ARCHIVE, never deleted)
export const BLOAT_CHANNEL_NAMES = [
  'deep-talk','venting','bar','academia','recipes-and-pics','cars-and-bikes',
  'tech-stuff','pets-and-plants','self-promo','customer-wins','lookbook',
  'socials','brand-missions','personal-training','content-creation','boosters',
  'polls','changelog','suggestions','streaks','level-rewards','minigames',
  'rank','leaderboard','level-up','rewards','market-watch','marketing-ideas',
  'vulnerabilities','creative-lab','public-filings','stock-watch','crypto-watch',
  'brand-radar','competitor-drops','daily-challenge','coinflip','trivia',
  'reaction-race','guess-number','mini-leaderboard','progress','training-advice',
  'lifting-form-check','nutrition-advice','cardio-advice','bodybuilding',
  'powerlifting-and-oly','martial-arts','home-gym','mobility-recovery',
  'progress-checks','fashion','cars-and-bikes','music','self-promo',
];
