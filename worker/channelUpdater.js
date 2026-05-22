import { client } from './discordClient.js';

const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Find a channel by name (partial match, emoji-safe) and update or post the bot's pinned message.
export async function updateChannel(channelName, payload) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) { console.warn('Guild not found:', GUILD_ID); return; }

    // Match channel by the text after ┃ or by full name
    const channel = guild.channels.cache.find(
      (c) => c.isTextBased() && (c.name === channelName || c.name.endsWith(`┃${channelName}`))
    );
    if (!channel) { console.warn('Channel not found:', channelName); return; }

    // Find the bot's last message in this channel (up to 20 back)
    const messages = await channel.messages.fetch({ limit: 20 });
    const existing = messages.find((m) => m.author.id === client.user.id);

    if (existing) {
      await existing.edit(payload);
    } else {
      await channel.send(payload);
    }
  } catch (err) {
    console.error(`updateChannel(${channelName}):`, err.message);
  }
}
