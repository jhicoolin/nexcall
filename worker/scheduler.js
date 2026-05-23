import cron from 'node-cron';
import { updateChannel } from './channelUpdater.js';
import { fetchAndBuildMarketWatch } from './feeds/marketWatch.js';
import { fetchAndBuildCompetitorWatch } from './feeds/competitorWatch.js';
import { fetchAndBuildMarketing } from './feeds/marketing.js';
import { fetchAndBuildCryptoLive } from './feeds/cryptoLive.js';

async function run(label, channelName, fetcher) {
  try {
    console.log(`  → ${channelName}`);
    const payload = await fetcher();
    await updateChannel(channelName, payload);
  } catch (err) {
    console.error(`  ✗ ${label}:`, err.message);
  }
}

// Every 5 min: crypto-live (public)
async function runCrypto() {
  console.log(`[${new Date().toISOString()}] Crypto update`);
  await run('crypto-live', 'crypto-live', fetchAndBuildCryptoLive);
}

// Every 15 min: stock market watch (public intel)
async function runMarket() {
  console.log(`[${new Date().toISOString()}] Market update`);
  // market-watch channel removed from public layout — crypto-live handles public
  // Internal competitor-watch stays in private STEPPIN HQ
  await run('competitor-watch', 'competitor-watch', fetchAndBuildCompetitorWatch);
}

// Every 30 min: internal marketing plays (private STEPPIN HQ)
async function runMarketing() {
  console.log(`[${new Date().toISOString()}] Marketing plays update`);
  await run('marketing-plays', 'marketing-plays', fetchAndBuildMarketing);
}

export function startScheduler() {
  // Run immediately on startup
  runCrypto();
  runMarket();
  runMarketing();

  // Crypto: every 5 min (public 📈┃crypto-live)
  cron.schedule('*/5 * * * *', runCrypto);

  // Competitor intel: every 15 min (private 👀┃competitor-watch in STEPPIN HQ)
  cron.schedule('*/15 * * * *', runMarket);

  // Marketing plays: every 30 min (private 💡┃marketing-plays in STEPPIN HQ)
  cron.schedule('*/30 * * * *', runMarketing);

  console.log('Scheduler started — crypto 5m, competitors 15m, marketing 30m.');
}
