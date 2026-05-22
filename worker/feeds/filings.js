// Source: SEC EDGAR — official US government data. Free, no key required.
// https://www.sec.gov/developer
// Required: User-Agent header with contact info per SEC guidelines.

const USER_AGENT = 'BadGenesBot/1.0 contact@badgenes.com';

const COMPANIES = [
  { name: 'Under Armour', cik: '0001336917' },
  { name: 'Lululemon',    cik: '0001397187' },
];

async function fetchCompanyFilings(company) {
  try {
    const res = await fetch(
      `https://data.sec.gov/submissions/CIK${company.cik}.json`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    const data = await res.json();
    const recent = data?.filings?.recent;
    if (!recent) return [];

    const results = [];
    const limit = Math.min(3, recent.form?.length ?? 0);
    for (let i = 0; i < limit; i++) {
      results.push({
        company: company.name,
        form: recent.form[i],
        date: recent.filingDate[i],
        accession: recent.accessionNumber?.[i]?.replace(/-/g, '') ?? '',
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function fetchAndBuildFilings() {
  const all = (await Promise.all(COMPANIES.map(fetchCompanyFilings))).flat();

  const fields = all.map((f) => ({
    name: `${f.company} — ${f.form}`,
    value: `Filed: ${f.date}${f.accession ? `\n[View on EDGAR](https://www.sec.gov/Archives/edgar/data/${f.accession})` : ''}`,
    inline: false,
  }));

  return {
    embeds: [{
      title: '🧾  Public Filings — UA & LULU',
      description: 'Recent SEC filings via EDGAR. Updated every 5 min.',
      color: 0x3498DB,
      fields: fields.length ? fields : [{ name: 'Status', value: 'No recent filings found.', inline: false }],
      footer: { text: 'Not financial advice. Bad Genetics HQ • Market Intel' },
      timestamp: new Date().toISOString(),
    }],
  };
}
