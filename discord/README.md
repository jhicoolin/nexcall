# Bad Genetics Genie — Discord Bot

Nested inside the NexCall project. Lives at `discord/` and is completely isolated from the NexCall website.

---

## How It Works

| Component | Location | Purpose |
|---|---|---|
| Bot source | `discord/src/` | All command handlers, utilities |
| API endpoint | `app/api/discord/interactions/` | Receives Discord webhooks |
| Registration script | `discord/scripts/register-commands.mjs` | Registers slash commands |
| DB schema | `discord/db/schema.sql` | Postgres schema for Phase 2 |

The interactions endpoint lives at:
```
https://your-nexcall-domain.vercel.app/api/discord/interactions
```

---

## Setup

### 1. Add environment variables

Add these to your `.env` (or Vercel project settings):

```
DISCORD_PUBLIC_KEY=        # Discord Dev Portal → App → General Information → Public Key
DISCORD_APPLICATION_ID=   # Discord Dev Portal → App → General Information → Application ID
DISCORD_BOT_TOKEN=        # Discord Dev Portal → App → Bot → Token (never commit this)
OPENAI_API_KEY=           # platform.openai.com
BADGENES_SITE_URL=        # e.g. https://badgenes.com
```

These are prefixed differently from NexCall's vars — no conflicts.

### 2. Install dependencies

From the nexcall project root:
```bash
npm install
```

`discord-interactions` and `openai` are added to nexcall's package.json.

### 3. Deploy

Deploy NexCall as normal — Vercel picks up the new `/api/discord/interactions` route automatically.

### 4. Set interactions endpoint in Discord

Go to **Discord Developer Portal → Your App → General Information → Interactions Endpoint URL** and set:
```
https://your-nexcall-domain.vercel.app/api/discord/interactions
```

Click **Save Changes**. Discord will ping the endpoint to verify. ✓

### 5. Register slash commands

```bash
node discord/scripts/register-commands.mjs
```

Run this once (or after adding new commands). For instant testing during development, uncomment the guild-scoped URL in the script.

### 6. Invite the bot

Discord Dev Portal → OAuth2 → URL Generator
- Scopes: `bot`, `applications.commands`
- Permissions: `Manage Channels`, `Send Messages`, `Embed Links`, `Read Message History`

---

## Commands

| Command | Description | Admin Only |
|---|---|---|
| `/setup` | Create the full Bad Genetics HQ channel structure | Yes |
| `/rules` | Post server rules embed | No |
| `/shop` | Link to BadGenes.com | No |
| `/drop` | Announce a product drop | Yes |
| `/genie ask` | AI assistant (OpenAI) | No |
| `/vip` | VIP role info | No |
| `/support` | Support info | No |
| `/level` | XP/level progress (stub — DB required) | No |
| `/leaderboard` | Top XP earners (stub — DB required) | No |
| `/routine` | Generate a workout routine | No |
| `/minigame` | Coinflip, trivia, daily challenge, guess | No |
| `/market` | Competitor signals, stock/crypto watch | No |
| `/ideas` | AI-generated marketing ideas | No |
| `/email` | Email subscription management (stub) | No |

---

## Phase 2

A separate always-on worker (Railway or Render) handles:
- XP tracking from messages (requires `DATABASE_URL`)
- Level-up announcements and role assignments
- Scheduled drop announcements
- Market/news polling via official APIs

Add `DATABASE_URL` (Supabase or Neon) to enable. Schema is in `discord/db/schema.sql`.

---

## NexCall Independence

This bot has zero impact on NexCall:
- No shared code with NexCall's app logic
- No shared database tables
- No pages, routes, or components visible on the website
- Environment variables use different key names
