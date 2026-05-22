// Combined market watch feed — posts to 📈┃market-watch
// Sources: CoinGecko (free/official), Yahoo Finance (public quotes), SEC EDGAR (US gov data)

const CG_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true';

const TICKERS = [
  { symbol: 'UA',   name: 'Under Armour' },
  { symbol: 'LULU', name: 'Lululemon' },
  { symbol: 'NKE',  name: 'Nike' },
  { symbol: 'ONON', name: 'On Holdings' },
];

function fmt(n) { return n == null ? 'N/A' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`; }
function arrow(n) { return n == null ? '' : Number(n) >= 0 ? '🟢 +' : '🔴 '; }

async function fetchCrypto() {
  try {
    const res  = await fetch(CG_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const coins = [
      { id: 'bitcoin',     label: '₿ BTC' },
      { id: 'ethereum',    label: '⟠ ETH' },
      { id: 'solana',      label: '◎ SOL' },
      { id: 'binancecoin', label: '🟡 BNB' },
    ];
    return coins.filter((c) => data[c.id]).map((c) => {
      const d = data[c.id];
      const chg = d.usd_24h_change?.toFixed(2);
      return `**${c.label}** ${fmt(d.usd)} ${arrow(chg)}${Math.abs(chg ?? 0)}%`;
    }).join('\n');
  } catch { return null; }
}

async function fetchStock(symbol) {
  try {
    const res  = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose ?? meta.previousClose;
    const chg   = price && prev ? ((price - prev) / prev * 100) : null;
    return { symbol, price, chg };
  } catch { return null; }
}

export async function fetchAndBuildMarketWatch() {
  const [cryptoStr, ...stockResults] = await Promise.all([
    fetchCrypto(),
    ...TICKERS.map((t) => fetchStock(t.symbol)),
  ]);

  const stockLines = TICKERS.map((t, i) => {
    const s = stockResults[i];
    if (!s) return `**${t.name} (${t.symbol})** N/A`;
    const a = s.chg == null ? '' : s.chg >= 0 ? '🟢 +' : '🔴 ';
    const c = s.chg == null ? '' : `${Math.abs(s.chg).toFixed(2)}%`;
    return `**${t.name} (${t.symbol})** ${fmt(s.price)} ${a}${c}`;
  }).join('\n');

  return {
    embeds: [{
      title: '📊  Market Watch',
      color: 0xe63946,
      fields: [
        { name: '₿ Crypto', value: cryptoStr || 'Unavailable', inline: false },
        { name: '📈 Stocks', value: stockLines, inline: false },
      ],
      footer: { text: 'Not financial advice • Sources: CoinGecko, Yahoo Finance • Bad Genetics HQ' },
      timestamp: new Date().toISOString(),
    }],
  };
}
