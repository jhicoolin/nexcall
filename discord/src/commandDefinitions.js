export const commands = [
  {
    name: 'setup',
    description: 'Configure Bad Genetics HQ server structure, roles, and embeds.',
    options: [
      { type: 1, name: 'preview', description: 'Preview what will be created — nothing is changed.' },
      { type: 1, name: 'apply',   description: 'Build the full server layout. Admin only.' },
      { type: 1, name: 'repair',  description: 'Check for missing channels and roles. Admin only.' },
    ],
  },
  { name: 'roles',       description: 'Repost the role selection menu in get-roles. Admin only.' },
  { name: 'rules',       description: 'Display the server rules.' },
  { name: 'shop',        description: 'Get the link to the Bad Genetics shop.' },
  {
    name: 'drop',
    description: 'Post a product drop announcement. Admin only.',
    options: [
      { type: 3, name: 'product_name', description: 'Product name',           required: true },
      { type: 3, name: 'drop_date',    description: 'Drop date',               required: true },
      { type: 3, name: 'link',         description: 'Product link',            required: true },
      { type: 3, name: 'image_url',    description: 'Product image URL',       required: false },
      { type: 3, name: 'notes',        description: 'Additional drop details', required: false },
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
  { name: 'vip',         description: 'VIP role info and perks.' },
  { name: 'support',     description: 'Get support info and contact options.' },
  {
    name: 'level',
    description: 'Check your XP, rank, and level.',
    options: [{ type: 6, name: 'user', description: 'Check another member', required: false }],
  },
  { name: 'leaderboard', description: 'View the top XP earners.' },
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
    name: 'market',
    description: 'Market intelligence and brand tracking.',
    options: [
      { type: 1, name: 'crypto',     description: 'Crypto overview.' },
      { type: 1, name: 'stock',      description: 'UA and LULU stock info.' },
      { type: 1, name: 'competitor', description: 'Competitor brand signals.' },
      { type: 1, name: 'marketing',  description: 'Marketing trends and angles.' },
    ],
  },
  {
    name: 'ideas',
    description: 'Generate BadGenes marketing ideas and campaign angles.',
    options: [{ type: 3, name: 'topic', description: 'Optional focus topic', required: false }],
  },
  {
    name: 'music',
    description: 'Music controls (Phase 2 — always-on worker required).',
    options: [
      { type: 1, name: 'nowplaying', description: 'Show now playing.' },
      { type: 1, name: 'queue',      description: 'Show queue.' },
      { type: 1, name: 'pause',      description: 'Pause.' },
      { type: 1, name: 'resume',     description: 'Resume.' },
      { type: 1, name: 'skip',       description: 'Skip track.' },
      { type: 1, name: 'stop',       description: 'Stop and clear queue.' },
      {
        type: 1, name: 'play', description: 'Queue a track (legal sources only).',
        options: [{ type: 3, name: 'link', description: 'Track link', required: true }],
      },
      {
        type: 1, name: 'volume', description: 'Set volume.',
        options: [{ type: 4, name: 'level', description: 'Volume 1–100', required: true }],
      },
    ],
  },
  {
    name: 'email',
    description: 'Manage email subscriptions.',
    options: [
      { type: 1, name: 'optin',   description: 'Opt in to email updates.' },
      { type: 1, name: 'optout',  description: 'Opt out of all emails.' },
      { type: 1, name: 'routine', description: 'Request your weekly email routine.' },
      { type: 1, name: 'weekly',  description: 'Request your weekly plan.' },
    ],
  },
];
