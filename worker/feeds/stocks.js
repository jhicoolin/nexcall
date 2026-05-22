// Source: Yahoo Finance chart endpoint — public, no auth required for basic quotes.
// Tracks apparel/fitness sector stocks relevant to Bad Genetics.

const TICKERS = [
  { symbol: 'UA',   name: 'Under Armour A' },
  { symbol: 'UAA',  name: 'Under Armour C' },
  { symbol: 'LULU', name: 'Lululemon' },
  { symbol: 'NKE',  name: 'Nike' },
  { symbol: 'SKX',  name: 'Skechers' },
];

async function fetchQuote(symbol) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price     = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose;
    const change    = price && prevClose ? ((price - prevClose) / prevClose * 100) : null;

    return { symbol, name: TICKERS.find((t) => t.symbol === symbol)?.name ?? symbol, price, change };
  } catch {
    return null;
  }
}

export async function fetchAndBuildStocks() {
  const results = await Promise.all(TICKERS.map((t) => fetchQuote(t.symbol)));
  const valid = results.filter(Boolean);

  const fields = valid.map((s) => {
    const arrow = s.change == null ? '' : s.change >= 0 ? '🟢 +' : '🔴 ';
    const chg   = s.change == null ? '' : `${Math.abs(s.change).toFixed(2)}%`;
    const price = s.price == null ? 'N/A' : `$${s.price.toFixed(2)}`;
    return {
      name: `${s.name} (${s.symbol})`,
      value: `${price}  ${arrow}${chg}`,
      inline: true,
    };
  });

  return {
    embeds: [{
      title: '📈  Apparel & Fitness Stocks',
      description: 'Market data via Yahoo Finance. Updated every 5 min.',
      color: 0x2ECC71,
      fields: fields.length ? fields : [{ name: 'Status', value: 'Market data temporarily unavailable.', inline: false }],
      footer: { text: 'Not financial advice. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}
