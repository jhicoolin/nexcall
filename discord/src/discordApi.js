const BASE = 'https://discord.com/api/v10';

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function webhookHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function apiCall(url, method, body, headers) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${method} ${url} → ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('application/json') ? res.json() : null;
}

export function getGuildChannels(guildId) {
  return apiCall(`${BASE}/guilds/${guildId}/channels`, 'GET', null, botHeaders());
}

export function createChannel(guildId, data) {
  return apiCall(`${BASE}/guilds/${guildId}/channels`, 'POST', data, botHeaders());
}

export function editOriginalResponse(token, data) {
  const appId = process.env.DISCORD_APPLICATION_ID;
  return apiCall(
    `${BASE}/webhooks/${appId}/${token}/messages/@original`,
    'PATCH',
    data,
    webhookHeaders()
  );
}

export function createFollowUp(token, data) {
  const appId = process.env.DISCORD_APPLICATION_ID;
  return apiCall(
    `${BASE}/webhooks/${appId}/${token}`,
    'POST',
    data,
    webhookHeaders()
  );
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
