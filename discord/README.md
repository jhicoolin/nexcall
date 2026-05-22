# Bad Genetics Genie — Discord Bot

Internal developer docs. This bot is publicly known only as **Genie** for **BadGenes (@badgenetic)**.

Lives in the `discord/` folder. Completely isolated from the main website codebase.

---

## Endpoint

```
https://nexcall.one/api/interactions
```

Set this as the **Interactions Endpoint URL** in Discord Developer Portal.

---

## Structure

| Path | Purpose |
|---|---|
| `discord/src/commands/` | All slash command handlers |
| `discord/src/router.js` | Routes interactions to handlers |
| `discord/src/permissions.js` | Permission bit-field helpers |
| `discord/src/rateLimit.js` | In-memory rate limiter |
| `discord/src/discordApi.js` | Discord REST API helpers |
| `discord/src/commandDefinitions.js` | Slash command schemas |
| `discord/scripts/register-commands.mjs` | Registers commands with Discord |
| `discord/db/schema.sql` | Postgres schema for Phase 2 |
| `app/api/interactions/route.ts` | Next.js API route — Discord webhook |

---

## Setup

### 1. Add environment variables to Vercel

```
DISCORD_PUBLIC_KEY=        # Discord Dev Portal → App → General Information → Public Key
DISCORD_APPLICATION_ID=   # Discord Dev Portal → App → General Information → Application ID
DISCORD_BOT_TOKEN=        # Discord Dev Portal → App → Bot → Token
OPENAI_API_KEY=           # platform.openai.com
BADGENES_SITE_URL=        # https://nexcall.one (or future badgenes.com)
```

### 2. Deploy

Deploy as normal. The `/api/interactions` route is picked up automatically.

### 3. Set interactions endpoint in Discord Developer Portal

Go to: **Your App → General Information → Interactions Endpoint URL**

Paste:
```
https://nexcall.one/api/interactions
```

Click **Save Changes**. Discord will ping it to verify.

### 4. Register slash commands

From the project root:
```bash
node discord/scripts/register-commands.mjs
```

Or use the npm shortcut:
```bash
npm run discord:register
```

Global commands take up to 1 hour to propagate. For instant dev testing, uncomment the guild-scoped URL in the register script.

### 5. Invite the bot

Discord Dev Portal → OAuth2 → URL Generator
- Scopes: `bot`, `applications.commands`
- Permissions: `Manage Channels`, `Send Messages`, `Embed Links`, `Read Message History`

---

## Commands

| Command | Description | Admin |
|---|---|---|
| `/setup` | Build full BadGenes HQ channel structure | Yes |
| `/rules` | Post server rules | No |
| `/shop` | Link to brand site | No |
| `/drop` | Announce a product drop | Yes |
| `/genie ask` | AI assistant | No |
| `/vip` | VIP perks info | No |
| `/support` | Support info | No |
| `/level` | XP/level stub (DB required) | No |
| `/leaderboard` | Top XP stub (DB required) | No |
| `/routine` | Workout routine generator | No |
| `/minigame` | Coinflip, trivia, guess, daily | No |
| `/market` | Competitor + market intel | No |
| `/ideas` | AI marketing ideas | No |
| `/email` | Email opt-in stub | No |

---

## Phase 2

Needs a separate always-on worker (Railway or Render) and `DATABASE_URL` for:
- XP tracking from messages
- Level-up announcements and role assignments
- Scheduled posts
- Market/news polling via official APIs

Schema: `discord/db/schema.sql`
