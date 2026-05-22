// All Bad Genetics HQ roles organized by group.
// Groups are used to build role menus and handle role toggling.

export const ROLE_GROUPS = {
  staff: [
    { name: '👑 Owner',      color: 0xFFD700, hoist: true },
    { name: '🛡️ Admin',     color: 0xe63946, hoist: true },
    { name: '🔰 Moderator', color: 0x57cc99, hoist: true },
    { name: '🧪 Trial Mod', color: 0x57cc99, hoist: false },
    { name: '🤖 Genie',     color: 0x7289DA, hoist: false },
  ],
  community: [
    { name: '🧬 BadGenes',   color: 0xe63946 },
    { name: '💎 VIP',        color: 0xFFD700 },
    { name: '🚀 Early Access', color: 0xFF6B6B },
  ],
  notifications: [
    { name: '🧢 Drop Alerts',     color: 0xFCA311 },
    { name: '📣 Event Alerts',    color: 0x3498DB },
    { name: '🏋️ Training Alerts', color: 0x57cc99 },
    { name: '📈 Market Alerts',   color: 0x2ECC71 },
    { name: '🎮 Minigames',       color: 0x9B59B6 },
  ],
  fitness: [
    { name: '🟥 Bulking',       color: 0xE74C3C },
    { name: '🍎 Maintaining',   color: 0x27AE60 },
    { name: '🥶 Cutting',       color: 0x3498DB },
    { name: '🍀 Recomposition', color: 0x1ABC9C },
  ],
  training: [
    { name: '💪 Bodybuilding', color: 0xe63946 },
    { name: '🏋️ Powerlifting', color: 0xFCA311 },
    { name: '🥋 Martial Arts', color: 0x2C3E50 },
    { name: '🏃 Cardio',       color: 0x3498DB },
    { name: '🧘 Mobility',     color: 0x1ABC9C },
    { name: '🏠 Home Gym',     color: 0x27AE60 },
    { name: '🤸 Calisthenics', color: 0x9B59B6 },
  ],
  levels: [
    { name: 'Initiate',        color: 0x95A5A6 },
    { name: 'Regular',         color: 0x3498DB },
    { name: 'Locked In',       color: 0x57cc99 },
    { name: 'BadGenes Elite',  color: 0xFCA311 },
    { name: 'Inner Circle',    color: 0xe63946 },
    { name: 'Genetic Legend',  color: 0xFFD700 },
  ],
};

export const ALL_ROLES = Object.values(ROLE_GROUPS).flat();

// Groups where only one role can be held at a time (mutually exclusive)
export const EXCLUSIVE_GROUPS = new Set(['fitness']);
