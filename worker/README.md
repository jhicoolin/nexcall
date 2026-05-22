# Bad Genetics Genie — Live Update Worker

Always-on Node.js worker. Runs on Railway (or Render/Fly.io).
Updates 8 Discord channels every 5 minutes with live data.

---

## Channels Updated

| Channel | Source | Interval |
|---|---|---|
| `₿┃crypto-watch` | CoinGecko API (free, official) | 5 min |
| `📈┃stock-watch` | Yahoo Finance (UA, LULU, NKE, SKX) | 5 min |
| `🧾┃public-filings` | SEC EDGAR (official US gov data) | 5 min |
| `👀┃competitor-drops` | Reddit public posts (Gymshark, YoungLA, LULU, UA) | 5 min |
| `🧠┃brand-radar` | Reddit trending streetwear/fitness | 5 min |
| `💡┃marketing-ideas` | OpenAI or curated rotation | 5 min |
| `⚠️┃vulnerabilities` | Curated competitor analysis rotation | 5 min |
| `🧪┃creative-lab` | Curated creative ideas rotation | 5 min |

---

## Required Environment Variables

```
DISCORD_BOT_TOKEN=      # Same token used in Vercel
DISCORD_GUILD_ID=       # Your server ID (right-click server → Copy Server ID)
OPENAI_API_KEY=         # Optional — enables AI-generated marketing ideas
```

---

## Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select `jhicoolin/nexcall`
4. Set **Root Directory** to `worker`
5. Add environment variables (above)
6. Deploy

Railway will auto-detect Node.js and run `npm start`.

---

## Deploy to Render

1. Go to [render.com](https://render.com)
2. New → **Background Worker**
3. Connect GitHub → `jhicoolin/nexcall`
4. Root directory: `worker`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables
8. Deploy

---

## How It Works

- On startup: connects to Discord gateway, runs all updates immediately
- Every 5 min: re-fetches all data sources, edits the bot's existing message in each channel
- One message per channel — always current, never floods the channel
- If bot has no message in a channel yet, posts a new one

---

## Data Sources

All compliant with Discord Developer Policy:
- **CoinGecko**: Free official API, no scraping
- **Yahoo Finance**: Public market data
- **SEC EDGAR**: Official US government data, free API
- **Reddit**: Official public JSON endpoint, proper User-Agent, source attribution, no full content reproduction
- **OpenAI**: Server-side only, not trained on Discord content
