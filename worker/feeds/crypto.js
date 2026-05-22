// Source: CoinGecko public API — free, official, no key required.
// https://www.coingecko.com/en/api/documentation

const COINS = 'bitcoin,ethereum,solana,binancecoin,chainlink';
const URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

function arrow(change) {
  if (change === null || change === undefined) return '';
  return Number(change) >= 0 ? '🟢 +' : '🔴 ';
}

function fmt(n) {
  return n == null ? 'N/A' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export async function fetchAndBuildCrypto() {
  const res = await fetch(URL, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();

  const coins = [
    { id: 'bitcoin',     label: '₿ Bitcoin (BTC)' },
    { id: 'ethereum',    label: '⟠ Ethereum (ETH)' },
    { id: 'solana',      label: '◎ Solana (SOL)' },
    { id: 'binancecoin', label: '🟡 BNB' },
    { id: 'chainlink',   label: '🔗 Chainlink (LINK)' },
  ];

  const fields = coins
    .filter((c) => data[c.id])
    .map((c) => {
      const d = data[c.id];
      const change = d.usd_24h_change?.toFixed(2);
      return {
        name: c.label,
        value: `${fmt(d.usd)}  ${arrow(change)}${Math.abs(change ?? 0)}%`,
        inline: true,
      };
    });

  return {
    embeds: [{
      title: '₿  Crypto Overview',
      description: 'Live prices via CoinGecko. Updated every 5 min.',
      color: 0xF7931A,
      fields,
      footer: { text: 'Not financial advice. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}
