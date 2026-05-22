// Full Bad Genetics HQ server layout.
// channel type 0 = text, 2 = voice, 4 = category
// readonly: @everyone cannot send messages
// postEmbed: bot posts a specific embed after channel creation

export const SERVER_STRUCTURE = [
  {
    category: '【👋】WELCOME',
    channels: [
      { name: '✅┃rules',     type: 0, readonly: true, postEmbed: 'rules' },
      { name: '👋┃welcome',   type: 0, readonly: true, postEmbed: 'welcome' },
      { name: '🎭┃get-roles', type: 0, readonly: true, postEmbed: 'roles' },
      { name: '📘┃resources', type: 0, readonly: true },
      { name: '❓┃ask-staff', type: 0 },
    ],
  },
  {
    category: '【📢】COMMUNITY',
    channels: [
      { name: '📣┃announcements',   type: 0, readonly: true },
      { name: '📝┃changelog',       type: 0, readonly: true },
      { name: '💡┃suggestions',     type: 0 },
      { name: '🌎┃polls',           type: 0 },
      { name: '📸┃content-creation',type: 0 },
      { name: '💜┃boosters',        type: 0 },
      { name: '🏋️┃personal-training',type: 0 },
    ],
  },
  {
    category: '【🧬】BADGENES',
    channels: [
      { name: '🛒┃shop',          type: 0, readonly: true },
      { name: '🔥┃drops',         type: 0, readonly: true },
      { name: '🧢┃fit-pics',      type: 0 },
      { name: '🌄┃scenery',       type: 0 },
      { name: '👕┃lookbook',      type: 0 },
      { name: '🏆┃customer-wins', type: 0 },
      { name: '📲┃socials',       type: 0 },
      { name: '🎯┃brand-missions',type: 0 },
    ],
  },
  {
    category: '【💬】CHATTING',
    channels: [
      { name: '💬┃general',   type: 0 },
      { name: '🎧┃media',     type: 0 },
      { name: '🤖┃bot-cmds',  type: 0 },
      { name: '🍻┃bar',       type: 0 },
      { name: '🧠┃deep-talk', type: 0 },
      { name: '😂┃memes',     type: 0 },
      { name: '🗣️┃venting',   type: 0 },
    ],
  },
  {
    category: '【💪】TRAINING',
    channels: [
      { name: '💪┃training-advice',     type: 0 },
      { name: '📸┃lifting-form-check',  type: 0 },
      { name: '🥗┃nutrition-advice',    type: 0 },
      { name: '🏃┃cardio-advice',       type: 0 },
      { name: '🏋️┃bodybuilding',        type: 0 },
      { name: '🏆┃powerlifting-and-oly',type: 0 },
      { name: '🥋┃martial-arts',        type: 0 },
      { name: '🏠┃home-gym',            type: 0 },
      { name: '🧘┃mobility-recovery',   type: 0 },
      { name: '📈┃progress-checks',     type: 0 },
      { name: '📅┃routines',            type: 0 },
    ],
  },
  {
    category: '【🏆】POPULAR REQUESTS',
    channels: [
      { name: '🔥┃academia',       type: 0 },
      { name: '🍲┃recipes-and-pics',type: 0 },
      { name: '👕┃fashion',        type: 0 },
      { name: '🚗┃cars-and-bikes', type: 0 },
      { name: '💻┃tech-stuff',     type: 0 },
      { name: '🐶┃pets-and-plants',type: 0 },
      { name: '🎵┃music',          type: 0 },
      { name: '📣┃self-promo',     type: 0 },
    ],
  },
  {
    category: '【📊】MARKET INTEL',
    channels: [
      { name: '🧠┃brand-radar',     type: 0 },
      { name: '📈┃stock-watch',     type: 0 },
      { name: '₿┃crypto-watch',    type: 0 },
      { name: '🧾┃public-filings',  type: 0 },
      { name: '👀┃competitor-drops',type: 0 },
      { name: '💡┃marketing-ideas', type: 0 },
      { name: '⚠️┃vulnerabilities', type: 0 },
      { name: '🧪┃creative-lab',    type: 0 },
    ],
  },
  {
    category: '【🎮】MINIGAMES',
    channels: [
      { name: '🎲┃daily-challenge', type: 0 },
      { name: '🪙┃coinflip',        type: 0 },
      { name: '🧩┃trivia',          type: 0 },
      { name: '⚡┃reaction-race',   type: 0 },
      { name: '🔢┃guess-number',    type: 0 },
      { name: '🏅┃mini-leaderboard',type: 0 },
    ],
  },
  {
    category: '【🎖️】LEVELING',
    channels: [
      { name: '🧬┃rank',         type: 0 },
      { name: '🏆┃leaderboard',  type: 0 },
      { name: '🎁┃level-rewards',type: 0, readonly: true },
      { name: '🔥┃streaks',      type: 0 },
    ],
  },
  {
    category: '【🎧】VOICE',
    channels: [
      { name: '🔊 Lounge',       type: 2 },
      { name: '🎵 Music',        type: 2 },
      { name: '🧠 Grind Room',   type: 2 },
      { name: '🏋️ Workout Room', type: 2 },
      { name: '💤 Chill',        type: 2 },
    ],
  },
];
