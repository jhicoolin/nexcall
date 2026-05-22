import cron from 'node-cron';
import { updateChannel } from './channelUpdater.js';
import { fetchAndBuildMarketWatch } from './feeds/marketWatch.js';
import { fetchAndBuildCompetitorWatch } from './feeds/competitorWatch.js';
import { fetchAndBuildMarketing, buildVulnerabilitiesEmbed, buildCreativeLabEmbed } from './feeds/marketing.js';

async function run(label, channelName, fetcher) {
  try {
    console.log(`  → ${channelName}`);
    const payload = await fetcher();
    await updateChannel(channelName, payload);
  } catch (err) {
    console.error(`  ✗ ${label}:`, err.message);
  }
}

// Every 15 min: market watch + competitor watch
async function runMarket() {
  console.log(`[${new Date().toISOString()}] Market update`);
  await Promise.allSettled([
    run('market-watch',    'market-watch',     fetchAndBuildMarketWatch),
    run('competitor-watch','competitor-watch', fetchAndBuildCompetitorWatch),
  ]);
}

// Every 30 min: marketing ideas rotation
async function runMarketing() {
  console.log(`[${new Date().toISOString()}] Marketing update`);
  await Promise.allSettled([
    run('marketing-ideas', 'marketing-ideas', fetchAndBuildMarketing),
  ]);
}

export function startScheduler() {
  // Run everything immediately on startup
  runMarket();
  runMarketing();

  // Market + competitors: every 15 min
  cron.schedule('*/15 * * * *', runMarket);

  // Marketing ideas: every 30 min
  cron.schedule('*/30 * * * *', runMarketing);

  console.log('Scheduler started — market every 15 min, marketing every 30 min.');
}
