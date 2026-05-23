// Public crypto feed — posts to 📈┃crypto-live every 5 min.
// Source: CoinGecko public API (free, official, no key required).

const URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,chainlink&vs_currencies=usd&include_24hr_change=true&include_market_cap=true';

function fmt(n) { return n == null ? 'N/A' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`; }
function fmtMcap(n) { if (!n) return ''; if (n > 1e12) return `${(n/1e12).toFixed(2)}T`; if (n > 1e9) return `${(n/1e9).toFixed(1)}B`; return `${(n/1e6).toFixed(0)}M`; }
function arrow(n) { return n == null ? '⬜' : Number(n) >= 0 ? '🟢' : '🔴'; }

export async function fetchAndBuildCryptoLive() {
  const res  = await fetch(URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();

  const coins = [
    { id: 'bitcoin',     sym: 'BTC', emoji: '₿' },
    { id: 'ethereum',    sym: 'ETH', emoji: '⟠' },
    { id: 'solana',      sym: 'SOL', emoji: '◎' },
    { id: 'binancecoin', sym: 'BNB', emoji: '🟡' },
    { id: 'chainlink',   sym: 'LINK',emoji: '🔗' },
  ];

  const lines = coins
    .filter((c) => data[c.id])
    .map((c) => {
      const d   = data[c.id];
      const chg = d.usd_24h_change;
      const pct = chg != null ? `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%` : '';
      const mcap = fmtMcap(d.usd_market_cap);
      return `${arrow(chg)} **${c.emoji} ${c.sym}** ${fmt(d.usd)} • ${pct} • MCap $${mcap}`;
    })
    .join('\n');

  return {
    embeds: [{
      title: '📈  Crypto Live',
      description: lines || 'Data unavailable.',
      color: 0xF7931A,
      footer: { text: '⚠️ Not financial advice • Source: CoinGecko • Bad Genetics HQ' },
      timestamp: new Date().toISOString(),
    }],
  };
}
