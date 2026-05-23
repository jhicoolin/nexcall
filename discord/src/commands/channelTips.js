import { isAdmin, noPermission, EPHEMERAL } from '../permissions.js';
import { getGuildChannels, getChannelMessages, sendMessage, delay } from '../discordApi.js';
import { buildTipEmbed, getBaseName } from '../channelTipsContent.js';
import { SERVER_STRUCTURE } from '../serverStructure.js';
import { editOriginalResponse } from '../discordApi.js';

export function handleChannelTips(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'refresh';
  if (sub === 'refresh') return handleRefresh(interaction, res);
  return res.json({ type: 4, data: { content: 'Unknown subcommand.', flags: EPHEMERAL } });
}

async function handleRefresh(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    const allChannels = await getGuildChannels(guildId);
    const channelMap  = new Map(allChannels.map((c) => [c.name, c.id]));

    let posted = 0;
    let skipped = 0;

    for (const { channels, staffOnly } of SERVER_STRUCTURE) {
      if (staffOnly) continue; // skip private channels

      for (const ch of channels) {
        if (ch.readonly || ch.postEmbed || ch.type !== 0) continue;
        const channelId = channelMap.get(ch.name);
        if (!channelId) { skipped++; continue; }

        const baseName = getBaseName(ch.name);
        const tip = buildTipEmbed(baseName);
        if (!tip) { skipped++; continue; }

        try {
          // Look for existing bot tip message and skip if already posted recently
          const messages = await getChannelMessages(channelId, 10);
          const botAppId = process.env.DISCORD_APPLICATION_ID;
          const existing = messages?.find?.((m) => m.author?.bot && m.application_id === botAppId);
          if (!existing) {
            await sendMessage(channelId, tip);
            posted++;
            await delay(400);
          } else {
            skipped++;
          }
        } catch (e) {
          console.error(`Tips error in ${ch.name}:`, e.message);
          skipped++;
        }
      }
    }

    await editOriginalResponse(token, {
      embeds: [{
        title: '✅  Channel Tips Refreshed',
        description: `Posted tips in **${posted}** channels. Skipped **${skipped}** (already have tips or no tip defined).`,
        color: 0xe63946,
        footer: { text: 'Bad Genetics HQ • Genie' },
      }],
    });
  } catch (err) {
    console.error('Channel tips error:', err);
    await editOriginalResponse(token, { content: `Failed: ${err.message}` }).catch(() => {});
  }
}
