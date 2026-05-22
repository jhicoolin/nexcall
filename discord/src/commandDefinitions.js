export const commands = [
  // ── Setup (admin) ─────────────────────────────────────────────────────────
  {
    name: 'setup',
    description: 'Configure the Bad Genetics HQ server. Admin only.',
    options: [
      { type: 1, name: 'preview',        description: 'Preview what will be created — no changes made.' },
      { type: 1, name: 'apply',          description: 'Build the full server layout, roles, and embeds.' },
      { type: 1, name: 'repair',         description: 'Check for and report missing channels and roles.' },
      { type: 1, name: 'clean',          description: 'Archive duplicate old channels (non-destructive).' },
      { type: 1, name: 'security-check', description: 'Audit permissions, env vars, and role hierarchy.' },
    ],
  },

  // ── Role menu (admin) ─────────────────────────────────────────────────────
  { name: 'roles', description: 'Repost the role selection menu. Admin only.' },

  // ── Mod (admin) ───────────────────────────────────────────────────────────
  {
    name: 'mod',
    description: 'Moderation tools. Admin/Mod only.',
    options: [
      {
        type: 1, name: 'warn', description: 'Issue a warning.',
        options: [
          { type: 6, name: 'user',   description: 'Member to warn', required: true },
          { type: 3, name: 'reason', description: 'Reason',         required: false },
        ],
      },
      {
        type: 1, name: 'kick', description: 'Kick a member.',
        options: [
          { type: 6, name: 'user',   description: 'Member to kick', required: true },
          { type: 3, name: 'reason', description: 'Reason',         required: false },
        ],
      },
      {
        type: 1, name: 'ban', description: 'Ban a member.',
        options: [
          { type: 6, name: 'user',   description: 'Member to ban', required: true },
          { type: 3, name: 'reason', description: 'Reason',        required: false },
        ],
      },
      {
        type: 1, name: 'purge', description: 'Delete messages.',
        options: [{ type: 4, name: 'amount', description: 'Number of messages (1–100)', required: true }],
      },
    ],
  },

  // ── Config (admin) ────────────────────────────────────────────────────────
  {
    name: 'config',
    description: 'View and set bot configuration. Admin only.',
    options: [
      { type: 1, name: 'view', description: 'View current config.' },
      {
        type: 1, name: 'set', description: 'Set a config value.',
        options: [
          { type: 3, name: 'key',   description: 'Config key',   required: true },
          { type: 3, name: 'value', description: 'New value',    required: true },
        ],
      },
    ],
  },

  // ── Analytics (admin) ─────────────────────────────────────────────────────
  {
    name: 'analytics',
    description: 'Server and bot analytics. Admin only.',
    options: [
      { type: 1, name: 'overview',  description: 'Overall bot health and stats.' },
      { type: 1, name: 'commands',  description: 'Command usage breakdown.' },
      { type: 1, name: 'growth',    description: 'Server growth metrics (Phase 2).' },
    ],
  },

  // ── Public commands ───────────────────────────────────────────────────────
  { name: 'rules',   description: 'Show server rules.' },
  { name: 'shop',    description: 'Link to the Bad Genetics shop.' },
  { name: 'support', description: 'Support info and contact.' },
  { name: 'vip',     description: 'VIP role info and perks.' },

  {
    name: 'drop',
    description: 'Post a product drop announcement. Admin only.',
    options: [
      { type: 3, name: 'product_name', description: 'Product name',  required: true },
      { type: 3, name: 'drop_date',    description: 'Drop date',      required: true },
      { type: 3, name: 'link',         description: 'Product URL',    required: true },
      { type: 3, name: 'image_url',    description: 'Image URL',      required: false },
      { type: 3, name: 'notes',        description: 'Extra details',  required: false },
    ],
  },

  {
    name: 'genie',
    description: 'Ask Genie — the BadGenes AI assistant.',
    options: [{
      type: 1, name: 'ask', description: 'Ask Genie a question.',
      options: [{ type: 3, name: 'question', description: 'Your question', required: true }],
    }],
  },

  {
    name: 'routine',
    description: 'Get a workout routine.',
    options: [{
      type: 3, name: 'type', description: 'Routine type', required: true,
      choices: [
        { name: 'Calisthenics',   value: 'calisthenics' },
        { name: 'Beginner Gym',   value: 'beginner' },
        { name: 'Hypertrophy',    value: 'hypertrophy' },
        { name: 'Fat Loss',       value: 'fat-loss' },
        { name: 'Athletic',       value: 'athletic' },
        { name: 'Bodyweight',     value: 'bodyweight' },
        { name: 'Mobility',       value: 'mobility' },
        { name: 'Push/Pull/Legs', value: 'ppl' },
        { name: 'Upper/Lower',    value: 'upper-lower' },
      ],
    }],
  },

  {
    name: 'ideas',
    description: 'Generate BadGenes marketing ideas and campaign angles.',
    options: [{ type: 3, name: 'topic', description: 'Optional focus topic', required: false }],
  },

  {
    name: 'minigame',
    description: 'Play a minigame.',
    options: [
      { type: 1, name: 'coinflip', description: 'Flip a coin.' },
      { type: 1, name: 'trivia',   description: 'Fitness trivia.' },
      { type: 1, name: 'daily',    description: "Today's daily challenge." },
      {
        type: 1, name: 'guess', description: 'Guess a number 1–100.',
        options: [{ type: 4, name: 'number', description: 'Your guess', required: true }],
      },
    ],
  },

  {
    name: 'level',
    description: 'Check your XP, rank, and level.',
    options: [{ type: 6, name: 'user', description: 'Check another member', required: false }],
  },
  { name: 'leaderboard', description: 'View the top XP earners.' },

  {
    name: 'market',
    description: 'Market intelligence and brand tracking.',
    options: [
      { type: 1, name: 'crypto',     description: 'Crypto overview.' },
      { type: 1, name: 'stock',      description: 'Apparel stock tracker.' },
      {
        type: 1, name: 'competitor', description: 'Competitor brand signals.',
        options: [{ type: 3, name: 'brand', description: 'Brand name (optional)', required: false }],
      },
      { type: 1, name: 'marketing', description: 'Marketing trends and opportunities.' },
    ],
  },

  {
    name: 'google',
    description: 'Search the web or images using Google Custom Search.',
    options: [
      {
        type: 1, name: 'search', description: 'Web search.',
        options: [{ type: 3, name: 'query', description: 'Search query', required: true }],
      },
      {
        type: 1, name: 'image', description: 'Image search (safe search ON).',
        options: [{ type: 3, name: 'query', description: 'Image search query', required: true }],
      },
    ],
  },

  {
    name: 'music',
    description: 'Music controls (Phase 2 — always-on worker required).',
    options: [
      { type: 1, name: 'nowplaying', description: 'Show now playing.' },
      { type: 1, name: 'queue',      description: 'Show queue.' },
      { type: 1, name: 'pause',      description: 'Pause playback.' },
      { type: 1, name: 'resume',     description: 'Resume playback.' },
      { type: 1, name: 'skip',       description: 'Skip current track.' },
      { type: 1, name: 'stop',       description: 'Stop and clear queue.' },
      {
        type: 1, name: 'play', description: 'Queue a track (legal sources only).',
        options: [{ type: 3, name: 'link', description: 'Track link', required: true }],
      },
    ],
  },

  {
    name: 'email',
    description: 'Manage email subscriptions (explicit opt-in only).',
    options: [
      { type: 1, name: 'optin',   description: 'Opt in to email updates.' },
      { type: 1, name: 'optout',  description: 'Opt out of all emails.' },
      { type: 1, name: 'routine', description: 'Request your weekly routine email.' },
      { type: 1, name: 'weekly',  description: 'Request your weekly plan email.' },
    ],
  },
];
