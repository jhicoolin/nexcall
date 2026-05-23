import { checkRateLimit } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';

const DISCLAIMER = '> Not financial advice. Informational only.';
const CG_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,chainlink&vs_currencies=usd&include_24hr_change=true&include_market_cap=true';

function fmt(n) { return n == null ? 'N/A' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`; }
function arrow(n) { return n == null ? '' : Number(n) >= 0 ? '🟢 +' : '🔴 '; }
function fmtMcap(n) { if (!n) return 'N/A'; if (n > 1e12) return `$${(n/1e12).toFixed(2)}T`; if (n > 1e9) return `$${(n/1e9).toFixed(1)}B`; return `$${(n/1e6).toFixed(0)}M`; }

export async function handleCrypto(interaction, res) {
  const sub    = interaction.data.options?.[0]?.name ?? 'view';
  const userId = interaction.member?.user?.id ?? 'anon';

  const limit = checkRateLimit(`crypto:${userId}`, 5, 60_000);
  if (!limit.allowed) {
    return res.json({ type: 4, data: { content: `Rate limit. Try again in ${limit.retryAfter}s.`, flags: EPHEMERAL } });
  }

  if (sub === 'view') {
    try {
      const response = await fetch(CG_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      const data = await response.json();

      const coins = [
        { id: 'bitcoin',     label: '₿ Bitcoin (BTC)' },
        { id: 'ethereum',    label: '⟠ Ethereum (ETH)' },
        { id: 'solana',      label: '◎ Solana (SOL)' },
        { id: 'binancecoin', label: '🟡 BNB' },
        { id: 'chainlink',   label: '🔗 Chainlink (LINK)' },
      ];

      const fields = coins.filter((c) => data[c.id]).map((c) => {
        const d   = data[c.id];
        const chg = d.usd_24h_change?.toFixed(2);
        return {
          name: c.label,
          value: `${fmt(d.usd)}\n${arrow(chg)}${Math.abs(chg ?? 0)}% 24h\nMcap: ${fmtMcap(d.usd_market_cap)}`,
          inline: true,
        };
      });

      return res.json({
        type: 4,
        data: {
          embeds: [{
            title: '₿  Live Crypto Prices',
            description: `Source: CoinGecko • Updated in 📈┃crypto-live every 5–15 min.\n${DISCLAIMER}`,
            color: 0xF7931A,
            fields,
            footer: { text: 'Bad Genetics HQ • Not financial advice' },
            timestamp: new Date().toISOString(),
          }],
          flags: EPHEMERAL,
        },
      });
    } catch (err) {
      return res.json({ type: 4, data: { content: 'Crypto data unavailable. Try again.', flags: EPHEMERAL } });
    }
  }

  if (sub === 'alert') {
    return res.json({
      type: 4,
      data: {
        embeds: [{
          title: '🚨  Crypto Alerts',
          description: 'Price alert thresholds require `DATABASE_URL` (Phase 2).\n\nAlerts will post to 🚨┃crypto-alerts when configured.\n\n' + DISCLAIMER,
          color: 0xe63946,
          footer: { text: 'Phase 2 feature. Bad Genetics HQ' },
        }],
        flags: EPHEMERAL,
      },
    });
  }

  return res.json({ type: 4, data: { content: 'Unknown crypto subcommand.', flags: EPHEMERAL } });
}
