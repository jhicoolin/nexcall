import { client } from './discordClient.js';
import { startScheduler } from './scheduler.js';

const required = ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  process.exit(1);
}

client.once('ready', () => {
  console.log(`Genie Worker online as ${client.user.tag}`);
  console.log(`Guild ID: ${process.env.DISCORD_GUILD_ID}`);
  startScheduler();
});

client.on('error', (err) => console.error('Discord client error:', err));

client.login(process.env.DISCORD_BOT_TOKEN);
