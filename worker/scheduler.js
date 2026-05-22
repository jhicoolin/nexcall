import cron from 'node-cron';
import { updateChannel } from './channelUpdater.js';
import { fetchAndBuildCrypto } from './feeds/crypto.js';
import { fetchAndBuildStocks } from './feeds/stocks.js';
import { fetchAndBuildFilings } from './feeds/filings.js';
import { fetchAndBuildCompetitors, fetchAndBuildBrandRadar } from './feeds/competitors.js';
import { fetchAndBuildMarketing, buildVulnerabilitiesEmbed, buildCreativeLabEmbed } from './feeds/marketing.js';

async function run(label, channelName, fetcher) {
  try {
    console.log(`  → updating ${channelName}`);
    const payload = await fetcher();
    await updateChannel(channelName, payload);
  } catch (err) {
    console.error(`  ✗ ${label}:`, err.message);
  }
}

async function runAll() {
  console.log(`[${new Date().toISOString()}] Running all channel updates...`);

  await Promise.allSettled([
    run('crypto',          'crypto-watch',      fetchAndBuildCrypto),
    run('stocks',          'stock-watch',        fetchAndBuildStocks),
    run('filings',         'public-filings',     fetchAndBuildFilings),
    run('competitors',     'competitor-drops',   fetchAndBuildCompetitors),
    run('brand-radar',     'brand-radar',        fetchAndBuildBrandRadar),
    run('marketing',       'marketing-ideas',    fetchAndBuildMarketing),
    run('vulnerabilities', 'vulnerabilities',    async () => buildVulnerabilitiesEmbed()),
    run('creative-lab',    'creative-lab',       async () => buildCreativeLabEmbed()),
  ]);

  console.log(`[${new Date().toISOString()}] Done.`);
}

export function startScheduler() {
  // Run immediately on startup
  runAll();

  // Then every 5 minutes
  cron.schedule('*/5 * * * *', runAll);

  console.log('Scheduler started — updates every 5 minutes.');
}
