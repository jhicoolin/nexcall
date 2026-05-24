/**
 * Bad Genetics Genie — Slash Command Registration
 *
 * Run from the project root:
 *   node discord/scripts/register-commands.mjs
 *
 * Requires a .env file (or environment) with:
 *   DISCORD_APPLICATION_ID
 *   DISCORD_BOT_TOKEN
 *
 * Global commands propagate within ~1 hour.
 * For instant dev registration, change the URL to the guild-scoped endpoint
 * (see comment at bottom of this file).
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv');
  dotenv.config({ path: resolve(__dirname, '../../.env') });
} catch {
  // dotenv unavailable — env vars must be set in the shell
}

const { commands } = await import('../src/commandDefinitions.js');

const APP_ID = process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error('ERROR: DISCORD_APPLICATION_ID (or DISCORD_CLIENT_ID) and DISCORD_BOT_TOKEN must be set.');
  console.error('Add them to .env in the project root.');
  process.exit(1);
}

// Global registration (all servers)
const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

// Guild-scoped (instant, dev only) — uncomment and set GUILD_ID:
// const GUILD_ID = 'YOUR_GUILD_ID';
// const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

async function register() {
  console.log(`Registering ${commands.length} commands for app ${APP_ID}...\n`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Discord API error ${res.status}:\n${body}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Successfully registered ${data.length} commands:\n`);
  data.forEach((cmd) => console.log(`  /${cmd.name.padEnd(14)} ${cmd.description}`));
  console.log('\nNote: Global commands take up to 1 hour to appear in Discord.');
  console.log('For instant testing, use guild-scoped registration (see comment in this file).');
}

register().catch((err) => {
  console.error('Registration failed:', err);
  process.exit(1);
});
