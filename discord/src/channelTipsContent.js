// Guide embeds posted in each core channel by /channel tips refresh.
// Keep each embed short, useful, and on-brand.

const BRAND = 0xe63946;

export const CHANNEL_TIPS = {
  'support': {
    title: '❓  Support',
    description: 'Ask questions here. A mod or Genie will get back to you.',
    fields: [
      { name: 'Order Issues',  value: `Visit [badgenes.com](${process.env.BADGENES_SITE_URL || 'https://nexcall.one'}) and use the contact form.`, inline: false },
      { name: 'Bot Help',      value: 'Use `/support` or `/genie ask` for instant answers.', inline: false },
      { name: 'Staff Contact', value: 'Post here or DM a moderator.', inline: false },
    ],
  },
  'fit-pics': {
    title: '🧢  Fit Pics',
    description: 'Post your BadGenetics fits, gym outfits, and streetwear looks.',
    fields: [
      { name: 'Tips',     value: '• Clean lighting\n• Full look preferred\n• Tag the brand if wearing BadGenetics', inline: false },
      { name: 'Feedback', value: '`/genie ask` — "rate my fit" or "give me style feedback"', inline: false },
    ],
  },
  'scenery': {
    title: '🌄  Scenery',
    description: 'Gym views, city shots, training spots, lifestyle photos.',
    fields: [
      { name: 'Caption Ideas', value: '`/genie ask` — "give me a caption for this photo"', inline: false },
    ],
  },
  'general': {
    title: '💬  General',
    description: 'Talk, network, ask anything. Keep it real, keep it clean.',
    fields: [
      { name: 'Commands', value: '`/genie ask` `/ideas` `/routine` `/minigame coinflip`', inline: false },
      { name: 'Topics',   value: 'Questions, goals, gym talk, life, anything on-brand.', inline: false },
    ],
  },
  'media': {
    title: '🎧  Media',
    description: 'Post videos, music links, content inspo, and creative reference.',
    fields: [
      { name: 'What to Post', value: 'Training videos, music finds, YouTube links, creative content', inline: false },
      { name: 'Commands',     value: '`/google image` for visuals', inline: false },
    ],
  },
  'memes': {
    title: '😂  Memes',
    description: 'Keep it funny. Keep it clean. No hate, no NSFW.',
    fields: [
      { name: 'Rules',    value: 'Gym memes, streetwear memes, lifestyle humor — on-brand only.', inline: false },
      { name: 'Commands', value: '`/minigame trivia` for a challenge', inline: false },
    ],
  },
  'bot-commands': {
    title: '🤖  Bot Commands',
    description: 'Use Genie commands here. Level-ups and announcements posted here too.',
    fields: [
      { name: 'Public Commands', value: '`/genie ask` `/routine` `/recipe` `/grailed` `/crypto view` `/ideas` `/minigame` `/level` `/leaderboard` `/market` `/google`', inline: false },
      { name: 'XP System',       value: 'Earn XP by messaging in any channel. Level up to unlock roles.', inline: false },
    ],
  },
  'training': {
    title: '💪  Training',
    description: 'Ask workout questions, share programs, discuss training approaches.',
    fields: [
      { name: 'Commands', value: '`/routine` `/genie ask` `/minigame daily`', inline: false },
      { name: 'Daily Tip', value: 'Genie posts a daily training tip here.', inline: false },
    ],
  },
  'form-check': {
    title: '📸  Form Check',
    description: 'Post lifting clips for feedback. Include context so people can actually help.',
    fields: [
      { name: 'Include',      value: '1. Exercise name\n2. Your goal\n3. Sets/reps/weight\n4. Any discomfort?', inline: false },
      { name: 'Disclaimer',   value: '⚕️ Feedback here is general education only — not medical advice.', inline: false },
    ],
  },
  'nutrition': {
    title: '🥗  Nutrition & Recipes',
    description: 'Meal ideas, macros, food pics, recipes. This is also the recipe channel.',
    fields: [
      { name: 'Recipe Commands', value: '`/recipe high-protein` `/recipe bulk` `/recipe cut` `/recipe meal-prep` `/recipe budget` `/recipe random`', inline: false },
      { name: 'Disclaimer',      value: 'Not medical or dietary advice. General guidance only.', inline: false },
    ],
  },
  'routines': {
    title: '📅  Routines',
    description: 'Weekly programs, training splits, and structured plans.',
    fields: [
      { name: 'Commands', value: '`/routine calisthenics` `/routine hypertrophy` `/routine fat-loss` `/routine ppl` `/routine upper-lower` `/routine athletic`', inline: false },
      { name: 'Weekly',   value: 'Genie posts a weekly routine template here.', inline: false },
    ],
  },
  'crypto-live': {
    title: '📈  Crypto Live',
    description: 'Auto-updated crypto prices every 5–15 minutes.',
    fields: [
      { name: 'Disclaimer', value: '**Not financial advice.** Informational only.', inline: false },
      { name: 'Commands',   value: '`/crypto view` for on-demand prices', inline: false },
    ],
  },
  'crypto-alerts': {
    title: '🚨  Crypto Alerts',
    description: 'Significant price movement alerts. Phase 2 feature with configurable thresholds.',
    fields: [
      { name: 'Status',     value: 'Alerts coming in Phase 2 with DATABASE_URL.', inline: false },
      { name: 'Disclaimer', value: 'Not financial advice.', inline: false },
    ],
  },
  'crypto-analysis': {
    title: '🧠  Crypto Analysis',
    description: 'Deep dives, macro trends, and pattern discussions.',
    fields: [
      { name: 'Commands',   value: '`/genie ask` — "explain Bitcoin\'s current macro trend"', inline: false },
      { name: 'Disclaimer', value: 'Not financial advice. All analysis is informational only.', inline: false },
    ],
  },
  'crypto-chat': {
    title: '💬  Crypto Chat',
    description: 'Discuss crypto, DeFi, NFTs, projects, and trends.',
    fields: [
      { name: 'Rules',      value: 'No financial advice, no scams, no pump-and-dump. Informational discussion only.', inline: false },
    ],
  },
  'grailed-search': {
    title: '🔎  Grailed Search',
    description: 'Find BadGenetics-style pieces: dark gymwear, compression, oversized tees, cargos, vintage athletic, street-gym.',
    fields: [
      { name: 'Commands',  value: '`/grailed search` — find pieces on Grailed', inline: false },
      { name: 'Aesthetic', value: 'Dark, athletic, street-gym. No random fashion spam.', inline: false },
    ],
  },
  'style-finds': {
    title: '👟  Style Finds',
    description: 'Post fits, inspo, and style finds. BadGenetics aesthetic: street-gym, dark minimalist.',
    fields: [
      { name: 'Aesthetic', value: 'Compression, cargo, dark oversized, vintage athletic, monochrome.', inline: false },
    ],
  },
  'badgenetics-fits': {
    title: '🧢  BadGenetics Fits',
    description: 'Show your BadGenetics gear. Tag @badgenetic for a chance at a repost.',
    fields: [
      { name: 'Shop', value: `[badgenes.com](${process.env.BADGENES_SITE_URL || 'https://nexcall.one'})`, inline: false },
    ],
  },
};

export function buildTipEmbed(channelBaseName) {
  const tip = CHANNEL_TIPS[channelBaseName];
  if (!tip) return null;
  return {
    embeds: [{
      title: tip.title,
      description: tip.description,
      color: BRAND,
      fields: tip.fields ?? [],
      footer: { text: 'Bad Genetics HQ • Genie — use /channel tips refresh to update' },
    }],
  };
}

// Get base channel name (strip emoji prefix)
export function getBaseName(channelName) {
  if (channelName.includes('┃')) return channelName.split('┃')[1];
  return channelName.replace(/\s/g, '-').toLowerCase();
}
