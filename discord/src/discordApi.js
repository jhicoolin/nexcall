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
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(`Discord API ${method} ${url} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Channels ─────────────────────────────────────────────────────────────────

export function getGuildChannels(guildId) {
  return apiCall(`${BASE}/guilds/${guildId}/channels`, 'GET', null, botHeaders());
}

export function createChannel(guildId, data) {
  return apiCall(`${BASE}/guilds/${guildId}/channels`, 'POST', data, botHeaders());
}

export function modifyChannel(channelId, data) {
  return apiCall(`${BASE}/channels/${channelId}`, 'PATCH', data, botHeaders());
}

export function pinMessage(channelId, messageId) {
  return apiCall(`${BASE}/channels/${channelId}/pins/${messageId}`, 'PUT', null, botHeaders());
}

export function getChannelMessages(channelId, limit = 20) {
  return apiCall(`${BASE}/channels/${channelId}/messages?limit=${limit}`, 'GET', null, botHeaders());
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export function getGuildRoles(guildId) {
  return apiCall(`${BASE}/guilds/${guildId}/roles`, 'GET', null, botHeaders());
}

export function createRole(guildId, data) {
  return apiCall(`${BASE}/guilds/${guildId}/roles`, 'POST', data, botHeaders());
}

export function addMemberRole(guildId, userId, roleId) {
  return apiCall(
    `${BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    'PUT', null, botHeaders()
  );
}

export function removeMemberRole(guildId, userId, roleId) {
  return apiCall(
    `${BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    'DELETE', null, botHeaders()
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function sendMessage(channelId, data) {
  return apiCall(`${BASE}/channels/${channelId}/messages`, 'POST', data, botHeaders());
}

// ── Interaction webhooks ───────────────────────────────────────────────────────

export function editOriginalResponse(token, data) {
  const appId = process.env.DISCORD_APPLICATION_ID;
  return apiCall(
    `${BASE}/webhooks/${appId}/${token}/messages/@original`,
    'PATCH', data, webhookHeaders()
  );
}

export function createFollowUp(token, data) {
  const appId = process.env.DISCORD_APPLICATION_ID;
  return apiCall(`${BASE}/webhooks/${appId}/${token}`, 'POST', data, webhookHeaders());
}

// ─────────────────────────────────────────────────────────────────────────────

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
