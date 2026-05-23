import { isAdmin, noPermission, EPHEMERAL, VIEW_CHANNEL, SEND_MESSAGES } from '../permissions.js';
import { getGuildChannels, createChannel, modifyChannel, getGuildRoles, createRole, sendMessage, editOriginalResponse, delay } from '../discordApi.js';
import { SERVER_STRUCTURE, BLOAT_CHANNEL_NAMES } from '../serverStructure.js';
import { ALL_ROLES, ROLE_GROUPS, STAFF_ROLE_NAMES } from '../roleStructure.js';
import { rulesEmbed, welcomeEmbed, shopEmbed, roleMenuMessages } from '../embeds.js';
import { buildTipEmbed, getBaseName, CHANNEL_TIPS } from '../channelTipsContent.js';

const ARCHIVE_CATEGORY = '【📦】ARCHIVE';

function readonlyOverwrites(guildId) {
  return [{ id: guildId, type: 0, allow: String(VIEW_CHANNEL), deny: String(SEND_MESSAGES) }];
}

function staffOverwrites(guildId, staffRoleIds) {
  return [
    { id: guildId, type: 0, deny: String(VIEW_CHANNEL | SEND_MESSAGES) },
    ...staffRoleIds.map((id) => ({ id, type: 0, allow: String(VIEW_CHANNEL | SEND_MESSAGES) })),
  ];
}

function privateOverwrites(guildId) {
  return [{ id: guildId, type: 0, deny: String(VIEW_CHANNEL | SEND_MESSAGES) }];
}

// ── Preview ──────────────────────────────────────────────────────────────────

export function handleSetupPreview(_interaction, res) {
  const totalCats = SERVER_STRUCTURE.length;
  const totalCh   = SERVER_STRUCTURE.reduce((n, s) => n + s.channels.length, 0);
  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: 'Setup Preview — Bad Genetics HQ',
        description: `**${totalCats} categories • ${totalCh} channels • ${ALL_ROLES.length} roles**\n\nRun \`/setup apply\` to build this.`,
        color: 0xe63946,
        fields: [
          { name: 'Categories', value: SERVER_STRUCTURE.map((s) => `${s.staffOnly ? '🔒 ' : ''}${s.category}`).join('\n'), inline: true },
          { name: 'Role Groups', value: Object.entries(ROLE_GROUPS).map(([g, r]) => `**${g}** (${r.length})`).join('\n'), inline: true },
          { name: 'Embeds', value: 'rules, welcome, shop, role menu, channel tips', inline: true },
        ],
        footer: { text: 'Preview only — nothing created' },
      }],
      flags: EPHEMERAL,
    },
  });
}

// ── Apply ────────────────────────────────────────────────────────────────────

export async function handleSetupApply(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    // 1. Roles
    const existingRoles    = await getGuildRoles(guildId);
    const existingRoleNames = new Set(existingRoles.map((r) => r.name));
    const roleMap           = new Map(existingRoles.map((r) => [r.name, r.id]));
    let rolesCreated = 0;

    for (const role of ALL_ROLES) {
      if (!existingRoleNames.has(role.name)) {
        const created = await createRole(guildId, { name: role.name, color: role.color ?? 0, hoist: role.hoist ?? false, mentionable: false });
        roleMap.set(role.name, created.id);
        rolesCreated++;
        await delay(350);
      }
    }

    const staffRoleIds = STAFF_ROLE_NAMES.map((n) => roleMap.get(n)).filter(Boolean);

    // 2. Channels
    const existingChannels = await getGuildChannels(guildId);
    const byNameType       = new Map(existingChannels.map((c) => [`${c.name}:${c.type}`, c]));
    const channelIdMap     = new Map(existingChannels.map((c) => [c.name, c.id]));
    let channelsCreated = 0;

    for (const { category, channels, staffOnly } of SERVER_STRUCTURE) {
      let categoryId;
      const catKey = `${category}:4`;
      if (byNameType.has(catKey)) {
        categoryId = byNameType.get(catKey).id;
      } else {
        const ow  = staffOnly ? staffOverwrites(guildId, staffRoleIds) : [];
        const cat = await createChannel(guildId, { name: category, type: 4, permission_overwrites: ow });
        categoryId = cat.id;
        channelsCreated++;
        await delay(350);
      }

      for (const ch of channels) {
        const chKey = `${ch.name}:${ch.type}`;
        if (!byNameType.has(chKey)) {
          let ow = [];
          if (ch.staffOnly || staffOnly) ow = staffOverwrites(guildId, staffRoleIds);
          else if (ch.readonly) ow = readonlyOverwrites(guildId);
          const created = await createChannel(guildId, { name: ch.name, type: ch.type, parent_id: categoryId, permission_overwrites: ow });
          channelIdMap.set(ch.name, created.id);
          channelsCreated++;
          await delay(350);
        }
      }
    }

    // 3. Embeds + tips
    let embedsPosted = 0;
    for (const { channels } of SERVER_STRUCTURE) {
      for (const ch of channels) {
        const channelId = channelIdMap.get(ch.name);
        if (!channelId) continue;

        try {
          if (ch.postEmbed === 'rules')   { await sendMessage(channelId, rulesEmbed());   embedsPosted++; }
          if (ch.postEmbed === 'welcome') { await sendMessage(channelId, welcomeEmbed()); embedsPosted++; }
          if (ch.postEmbed === 'shop')    { await sendMessage(channelId, shopEmbed());    embedsPosted++; }
          if (ch.postEmbed === 'roles')   {
            for (const msg of roleMenuMessages(roleMap)) { await sendMessage(channelId, msg); await delay(300); }
            embedsPosted++;
          }

          // Post channel tip in every non-readonly public channel
          if (!ch.postEmbed && !ch.readonly && !ch.staffOnly) {
            const baseName = getBaseName(ch.name);
            const tip = buildTipEmbed(baseName);
            if (tip) { await sendMessage(channelId, tip); embedsPosted++; }
          }
        } catch (e) { console.error(`Embed error in ${ch.name}:`, e.message); }

        await delay(300);
      }
    }

    await editOriginalResponse(token, {
      embeds: [{
        title: '✅  Setup Complete',
        color: 0xe63946,
        fields: [
          { name: 'Roles',    value: String(rolesCreated),    inline: true },
          { name: 'Channels', value: String(channelsCreated), inline: true },
          { name: 'Embeds',   value: String(embedsPosted),    inline: true },
          { name: 'Next',     value: '1. Move 🤖 Genie role to top of role list\n2. Assign 👑 Owner/🛡️ Admin manually\n3. Run `/setup security-check`', inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • Genie' },
        timestamp: new Date().toISOString(),
      }],
    });
  } catch (err) {
    console.error('Setup error:', err);
    await editOriginalResponse(token, { content: `Setup error: ${err.message}\n\nMake sure Genie has **Administrator** and its role is near the top.` }).catch(() => {});
  }
}

// ── Archive Bloat ─────────────────────────────────────────────────────────────

export async function handleSetupArchiveBloat(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    const existing = await getGuildChannels(guildId);

    // Find or create archive category
    let archiveCategory = existing.find((c) => c.type === 4 && c.name === ARCHIVE_CATEGORY);
    if (!archiveCategory) {
      archiveCategory = await createChannel(guildId, {
        name: ARCHIVE_CATEGORY,
        type: 4,
        permission_overwrites: [{ id: guildId, type: 0, deny: String(VIEW_CHANNEL | SEND_MESSAGES) }],
      });
      await delay(500);
    }

    // Find bloat channels
    const bloatChannels = existing.filter((c) => {
      if (c.type === 4) return false; // skip categories
      const base = c.name.includes('┃') ? c.name.split('┃')[1] : c.name;
      return BLOAT_CHANNEL_NAMES.some((b) => base.toLowerCase() === b.toLowerCase());
    });

    let moved = 0;
    for (const ch of bloatChannels) {
      try {
        await modifyChannel(ch.id, { parent_id: archiveCategory.id });
        moved++;
        await delay(350);
      } catch (e) {
        console.error(`Could not archive ${ch.name}:`, e.message);
      }
    }

    await editOriginalResponse(token, {
      embeds: [{
        title: '📦  Bloat Archived',
        description: `Moved **${moved}** channels to 【📦】ARCHIVE (private).\n\nNothing was deleted. Admins can still access the archive category.`,
        color: 0xe63946,
        footer: { text: 'Bad Genetics HQ • Genie' },
        timestamp: new Date().toISOString(),
      }],
    });
  } catch (err) {
    console.error('Archive error:', err);
    await editOriginalResponse(token, { content: `Archive failed: ${err.message}` }).catch(() => {});
  }
}

// ── Repair ────────────────────────────────────────────────────────────────────

export async function handleSetupRepair(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    const [existingRoles, existingChannels] = await Promise.all([getGuildRoles(guildId), getGuildChannels(guildId)]);
    const existingRoleNames    = new Set(existingRoles.map((r) => r.name));
    const existingChannelNames = new Set(existingChannels.map((c) => c.name));

    const missingRoles    = ALL_ROLES.filter((r) => !existingRoleNames.has(r.name));
    const missingChannels = SERVER_STRUCTURE.flatMap((s) => s.channels.filter((c) => !existingChannelNames.has(c.name)).map((c) => c.name));

    await editOriginalResponse(token, {
      embeds: [{
        title: '🔧  Repair Report',
        color: 0xe63946,
        fields: [
          { name: 'Missing Roles',    value: missingRoles.length    ? missingRoles.map((r) => r.name).join('\n')    : '✅ All present', inline: true },
          { name: 'Missing Channels', value: missingChannels.length ? missingChannels.slice(0, 15).join('\n') : '✅ All present', inline: true },
        ],
        footer: { text: 'Run /setup apply to fix.' },
      }],
    });
  } catch (err) {
    await editOriginalResponse(token, { content: `Repair check failed: ${err.message}` }).catch(() => {});
  }
}

// ── Security Check ────────────────────────────────────────────────────────────

export async function handleSetupSecurityCheck(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;
  const issues  = [];
  const passes  = [];

  const critical = ['DISCORD_BOT_TOKEN', 'DISCORD_APPLICATION_ID', 'DISCORD_PUBLIC_KEY', 'OPENAI_API_KEY', 'BADGENES_SITE_URL'];
  const missingCritical = critical.filter((k) => !process.env[k]);
  if (missingCritical.length) issues.push(`❌ Missing critical env vars: \`${missingCritical.join('`, `')}\``);
  else passes.push('✅ All critical env vars present');

  if (!process.env.DATABASE_URL)   issues.push('⚠️ `DATABASE_URL` not set — XP/levels disabled');
  if (!process.env.DISCORD_GUILD_ID) issues.push('⚠️ `DISCORD_GUILD_ID` not set — live update worker disabled');

  try {
    const roles = await getGuildRoles(guildId);
    const genieRole = roles.find((r) => r.name.includes('Genie'));
    const maxPos = Math.max(...roles.filter((r) => r.name !== '@everyone').map((r) => r.position));
    if (!genieRole) issues.push('❌ 🤖 Genie role not found — run `/setup apply`');
    else if (genieRole.position < maxPos - 3) issues.push(`⚠️ Genie role too low (${genieRole.position}/${maxPos}) — move it higher`);
    else passes.push(`✅ Genie role position OK (${genieRole.position}/${maxPos})`);
  } catch (e) { issues.push(`⚠️ Could not check roles: ${e.message}`); }

  try {
    const channels = await getGuildChannels(guildId);
    const adminCh = channels.find((c) => c.name.includes('admin-commands') || c.name.includes('internal-strategy'));
    if (adminCh) {
      const ow = adminCh.permission_overwrites?.find((o) => o.id === guildId);
      if (ow && BigInt(ow.deny ?? 0) & VIEW_CHANNEL) passes.push('✅ STEPPIN HQ channels are private');
      else issues.push('❌ STEPPIN HQ channels may be visible to @everyone — re-run `/setup apply`');
    } else {
      issues.push('⚠️ STEPPIN HQ not found — run `/setup apply`');
    }
  } catch (e) { issues.push(`⚠️ Could not check channels: ${e.message}`); }

  const apis = ['OPENAI_API_KEY','GOOGLE_CSE_API_KEY','REDDIT_CLIENT_ID','FINNHUB_API_KEY'];
  const missingApis = apis.filter((k) => !process.env[k]);
  if (missingApis.length) issues.push(`⚠️ Optional APIs not configured: \`${missingApis.join('`, `')}\``);

  await editOriginalResponse(token, {
    embeds: [{
      title: '🔒  Security Check',
      color: issues.some((i) => i.startsWith('❌')) ? 0xe63946 : 0x57cc99,
      fields: [
        { name: '✅ Passing', value: passes.join('\n') || 'None', inline: false },
        { name: '⚠️ Issues',  value: issues.join('\n') || 'None found ✅', inline: false },
      ],
      footer: { text: 'Bad Genetics HQ • Genie Security Check' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function handleSetup(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'preview';
  if (sub === 'preview')        return handleSetupPreview(interaction, res);
  if (sub === 'apply')          return handleSetupApply(interaction, res);
  if (sub === 'repair')         return handleSetupRepair(interaction, res);
  if (sub === 'archive-bloat')  return handleSetupArchiveBloat(interaction, res);
  if (sub === 'security-check') return handleSetupSecurityCheck(interaction, res);
  return handleSetupPreview(interaction, res);
}
