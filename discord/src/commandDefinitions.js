export const commands = [
  {
    name: 'setup',
    description: 'Reorganize the server into the official Bad Genetics HQ structure. Admin only.',
  },
  {
    name: 'rules',
    description: 'Display the Bad Genetics HQ server rules.',
  },
  {
    name: 'shop',
    description: 'Get the link to the Bad Genetics shop.',
  },
  {
    name: 'drop',
    description: 'Announce a new product drop. Admin only.',
    options: [
      { type: 3, name: 'product_name', description: 'Name of the product', required: true },
      { type: 3, name: 'drop_date', description: 'Drop date (e.g. June 1, 2026)', required: true },
      { type: 3, name: 'link', description: 'Direct link to the product page', required: true },
      { type: 3, name: 'image_url', description: 'Product image URL', required: false },
      { type: 3, name: 'notes', description: 'Additional notes about the drop', required: false },
    ],
  },
  {
    name: 'genie',
    description: 'Ask Genie, the Bad Genetics AI assistant.',
    options: [
      {
        type: 1,
        name: 'ask',
        description: 'Ask Genie a question.',
        options: [
          {
            type: 3,
            name: 'question',
            description: 'Your question for Genie',
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: 'vip',
    description: 'VIP role info and perks.',
  },
  {
    name: 'support',
    description: 'Get support info and contact options.',
  },
  {
    name: 'level',
    description: 'Check your XP, rank, and level progress.',
    options: [
      {
        type: 6,
        name: 'user',
        description: 'Check another member\'s level',
        required: false,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'View the top XP earners in the server.',
  },
  {
    name: 'routine',
    description: 'Get a workout routine.',
    options: [
      {
        type: 3,
        name: 'type',
        description: 'Type of routine',
        required: true,
        choices: [
          { name: 'Calisthenics', value: 'calisthenics' },
          { name: 'Beginner Gym', value: 'beginner' },
          { name: 'Hypertrophy', value: 'hypertrophy' },
          { name: 'Fat Loss', value: 'fat-loss' },
          { name: 'Athletic', value: 'athletic' },
          { name: 'Bodyweight', value: 'bodyweight' },
        ],
      },
    ],
  },
  {
    name: 'minigame',
    description: 'Play a minigame.',
    options: [
      { type: 1, name: 'coinflip', description: 'Flip a coin — heads or tails.' },
      { type: 1, name: 'trivia', description: 'Answer a random fitness trivia question.' },
      { type: 1, name: 'daily', description: 'Get today\'s daily challenge.' },
      {
        type: 1,
        name: 'guess',
        description: 'Guess a number between 1 and 100.',
        options: [
          { type: 4, name: 'number', description: 'Your guess (1-100)', required: true },
        ],
      },
    ],
  },
  {
    name: 'market',
    description: 'Market intelligence and competitor tracking.',
    options: [
      { type: 1, name: 'crypto', description: 'Crypto market overview (informational only).' },
      { type: 1, name: 'stock', description: 'Track UA and LULU stock info (informational only).' },
      { type: 1, name: 'competitor', description: 'Competitor brand signals and public activity.' },
      { type: 1, name: 'marketing', description: 'Marketing observations and public trends.' },
    ],
  },
  {
    name: 'ideas',
    description: 'Generate marketing ideas, campaign angles, and community challenges.',
    options: [
      { type: 3, name: 'topic', description: 'Optional focus topic', required: false },
    ],
  },
  {
    name: 'email',
    description: 'Manage email routine subscriptions.',
    options: [
      { type: 1, name: 'optin', description: 'Opt in to email routines and updates.' },
      { type: 1, name: 'optout', description: 'Opt out of all emails.' },
      { type: 1, name: 'routine', description: 'Request your weekly email workout routine.' },
      { type: 1, name: 'weekly', description: 'Request your weekly plan email.' },
    ],
  },
];
