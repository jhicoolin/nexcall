import { hasManageGuild, EPHEMERAL } from '../permissions.js';
import { getGuildChannels, createChannel, editOriginalResponse, delay } from '../discordApi.js';

const DEFERRED = { type: 5 };

const SERVER_STRUCTURE = [
  {
    category: 'START HERE',
    channels: [
      { name: 'welcome-and-rules', type: 0 },
      { name: 'announcements', type: 0 },
      { name: 'start-here', type: 0 },
      { name: 'roles', type: 0 },
    ],
  },
  {
    category: 'BADGENES',
    channels: [
      { name: 'drops', type: 0 },
      { name: 'shop', type: 0 },
      { name: 'fit-pics', type: 0 },
      { name: 'scenery', type: 0 },
      { name: 'lookbook', type: 0 },
      { name: 'customer-wins', type: 0 },
    ],
  },
  {
    category: 'TRAINING',
    channels: [
      { name: 'routines', type: 0 },
      { name: 'calisthenics', type: 0 },
      { name: 'gym-splits', type: 0 },
      { name: 'nutrition', type: 0 },
      { name: 'progress-checks', type: 0 },
    ],
  },
  {
    category: 'COMMUNITY',
    channels: [
      { name: 'general', type: 0 },
      { name: 'off-topic', type: 0 },
      { name: 'minigames', type: 0 },
      { name: 'leveling', type: 0 },
      { name: 'memes', type: 0 },
    ],
  },
  {
    category: 'MARKET INTEL',
    channels: [
      { name: 'brand-radar', type: 0 },
      { name: 'crypto-watch', type: 0 },
      { name: 'stock-watch', type: 0 },
      { name: 'competitor-drops', type: 0 },
      { name: 'marketing-ideas', type: 0 },
    ],
  },
  {
    category: 'SUPPORT',
    channels: [
      { name: 'support', type: 0 },
      { name: 'order-help', type: 0 },
      { name: 'faq', type: 0 },
      { name: 'contact', type: 0 },
    ],
  },
  {
    category: 'VOICE',
    channels: [
      { name: 'lounge', type: 2 },
      { name: 'music', type: 2 },
      { name: 'grind-room', type: 2 },
    ],
  },
];

export async function handleSetup(interaction, res) {
  if (!hasManageGuild(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Manage Server** permission to run `/setup`.', flags: EPHEMERAL },
    });
  }

  // Acknowledge immediately — setup takes several seconds
  res.json(DEFERRED);

  const guildId = interaction.guild_id;
  const token = interaction.token;

  try {
    const existing = await getGuildChannels(guildId);
    const byNameType = new Map(existing.map((c) => [`${c.name}:${c.type}`, c]));

    let created = 0;
    let skipped = 0;

    for (const { category, channels } of SERVER_STRUCTURE) {
      // Find or create category (type 4)
      let categoryId;
      const catKey = `${category}:4`;
      if (byNameType.has(catKey)) {
        categoryId = byNameType.get(catKey).id;
        skipped++;
      } else {
        const cat = await createChannel(guildId, { name: category, type: 4 });
        categoryId = cat.id;
        created++;
        await delay(300);
      }

      for (const ch of channels) {
        const chKey = `${ch.name}:${ch.type}`;
        if (byNameType.has(chKey)) {
          skipped++;
        } else {
          await createChannel(guildId, { name: ch.name, type: ch.type, parent_id: categoryId });
          created++;
          await delay(300);
        }
      }
    }

    await editOriginalResponse(token, {
      embeds: [
        {
          title: 'Server Setup Complete',
          description: `Bad Genetics HQ structure is ready.`,
          color: 0xe63946,
          fields: [
            { name: 'Created', value: String(created), inline: true },
            { name: 'Already Existed', value: String(skipped), inline: true },
          ],
          footer: { text: 'Bad Genetics HQ • Genie' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    console.error('Setup error:', err);
    await editOriginalResponse(token, {
      content: 'Setup encountered an error. Some channels may have been created. Check bot permissions (Manage Channels required).',
      flags: EPHEMERAL,
    }).catch(() => {});
  }
}
