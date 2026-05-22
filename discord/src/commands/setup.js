import { isAdmin, noPermission, EPHEMERAL, VIEW_CHANNEL, SEND_MESSAGES } from '../permissions.js';
import { getGuildChannels, createChannel, getGuildRoles, createRole, sendMessage, editOriginalResponse, delay } from '../discordApi.js';
import { SERVER_STRUCTURE } from '../serverStructure.js';
import { ALL_ROLES, ROLE_GROUPS, STAFF_ROLE_NAMES } from '../roleStructure.js';
import { rulesEmbed, welcomeEmbed, shopEmbed, roleMenuMessages } from '../embeds.js';

const DEFERRED = { type: 5, data: { flags: EPHEMERAL } };

// Permission overwrite builders
function readonlyOverwrites(guildId) {
  return [{ id: guildId, type: 0, allow: String(VIEW_CHANNEL), deny: String(SEND_MESSAGES) }];
}

function staffOverwrites(guildId, staffRoleIds) {
  return [
    { id: guildId, type: 0, deny: String(VIEW_CHANNEL | SEND_MESSAGES) },
    ...staffRoleIds.map((id) => ({ id, type: 0, allow: String(VIEW_CHANNEL | SEND_MESSAGES) })),
  ];
}

// ── Preview ──────────────────────────────────────────────────────────────────

export function handleSetupPreview(_interaction, res) {
  const totalCats = SERVER_STRUCTURE.length;
  const totalCh   = SERVER_STRUCTURE.reduce((n, s) => n + s.channels.length, 0);
  const totalRoles = ALL_ROLES.length;

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: 'Setup Preview — Bad Genetics HQ',
        description: `Run \`/setup apply\` to build this.\n\n**${totalCats} categories • ${totalCh} channels • ${totalRoles} roles**`,
        color: 0xe63946,
        fields: [
          { name: 'Categories', value: SERVER_STRUCTURE.map((s) => `${s.staffOnly ? '🔒 ' : ''}${s.category}`).join('\n'), inline: true },
          { name: 'Role Groups', value: Object.entries(ROLE_GROUPS).map(([g, r]) => `**${g}** (${r.length})`).join('\n'), inline: true },
          { name: 'Embeds', value: 'rules, welcome, shop, role menu', inline: true },
        ],
        footer: { text: 'Preview only — nothing will be created' },
      }],
      flags: EPHEMERAL,
    },
  });
}

// ── Apply ────────────────────────────────────────────────────────────────────

export async function handleSetupApply(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);

  res.json({ type: 5 }); // deferred public — show "thinking" to channel

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

    // 2. Staff role IDs for private channels
    const staffRoleIds = STAFF_ROLE_NAMES.map((n) => roleMap.get(n)).filter(Boolean);

    // 3. Channels
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
        const overwrites = staffOnly ? staffOverwrites(guildId, staffRoleIds) : [];
        const cat = await createChannel(guildId, { name: category, type: 4, permission_overwrites: overwrites });
        categoryId = cat.id;
        channelsCreated++;
        await delay(350);
      }

      for (const ch of channels) {
        const chKey = `${ch.name}:${ch.type}`;
        if (!byNameType.has(chKey)) {
          let overwrites = [];
          if (ch.staffOnly || staffOnly) overwrites = staffOverwrites(guildId, staffRoleIds);
          else if (ch.readonly) overwrites = readonlyOverwrites(guildId);

          const created = await createChannel(guildId, { name: ch.name, type: ch.type, parent_id: categoryId, permission_overwrites: overwrites });
          channelIdMap.set(ch.name, created.id);
          channelsCreated++;
          await delay(350);
        }
      }
    }

    // 4. Embeds
    let embedsPosted = 0;
    for (const { channels } of SERVER_STRUCTURE) {
      for (const ch of channels) {
        if (!ch.postEmbed) continue;
        const channelId = channelIdMap.get(ch.name);
        if (!channelId) continue;

        try {
          if (ch.postEmbed === 'rules')   { await sendMessage(channelId, rulesEmbed()); embedsPosted++; }
          if (ch.postEmbed === 'welcome') { await sendMessage(channelId, welcomeEmbed()); embedsPosted++; }
          if (ch.postEmbed === 'shop')    { await sendMessage(channelId, shopEmbed()); embedsPosted++; }
          if (ch.postEmbed === 'roles') {
            for (const msg of roleMenuMessages(roleMap)) { await sendMessage(channelId, msg); await delay(300); }
            embedsPosted++;
          }
        } catch (e) { console.error(`Embed error in ${ch.name}:`, e.message); }

        await delay(300);
      }
    }

    await editOriginalResponse(token, {
      embeds: [{
        title: '✅  Setup Complete',
        description: 'Bad Genetics HQ is ready.',
        color: 0xe63946,
        fields: [
          { name: 'Roles Created',    value: String(rolesCreated),    inline: true },
          { name: 'Channels Created', value: String(channelsCreated), inline: true },
          { name: 'Embeds Posted',    value: String(embedsPosted),    inline: true },
          { name: 'Next Steps', value: '1. Move 🤖 Genie role to the **top** of the role list\n2. Manually assign 👑 Owner and 🛡️ Admin roles\n3. Run `/setup security-check`', inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • Genie' },
        timestamp: new Date().toISOString(),
      }],
    });
  } catch (err) {
    console.error('Setup error:', err);
    await editOriginalResponse(token, { content: `Setup error: ${err.message}\n\nMake sure Genie has **Administrator** and its role is near the top of the role list.` }).catch(() => {});
  }
}

// ── Repair ───────────────────────────────────────────────────────────────────

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
        footer: { text: 'Run /setup apply to create missing items.' },
      }],
    });
  } catch (err) {
    await editOriginalResponse(token, { content: `Repair check failed: ${err.message}` }).catch(() => {});
  }
}

// ── Clean ────────────────────────────────────────────────────────────────────

export async function handleSetupClean(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);

  return res.json({
    type: 4,
    data: {
      embeds: [{
        title: '🧹  Setup Clean',
        description: 'Clean mode renames duplicate old channels with a `[archived-]` prefix instead of deleting them.\n\nThis feature is coming in the next update. Run `/setup repair` to see missing items, or delete duplicate channels manually in Discord.',
        color: 0xe63946,
      }],
      flags: EPHEMERAL,
    },
  });
}

// ── Security Check ───────────────────────────────────────────────────────────

export async function handleSetupSecurityCheck(interaction, res) {
  if (!isAdmin(interaction)) return noPermission(res);
  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;
  const issues  = [];
  const passes  = [];

  // Env vars
  const critical = ['DISCORD_BOT_TOKEN', 'DISCORD_APPLICATION_ID', 'DISCORD_PUBLIC_KEY', 'OPENAI_API_KEY', 'BADGENES_SITE_URL'];
  const optional = ['DATABASE_URL', 'DISCORD_GUILD_ID', 'DISCORD_ADMIN_ROLE_ID', 'FINNHUB_API_KEY', 'GOOGLE_CSE_API_KEY', 'REDDIT_CLIENT_ID'];

  const missingCritical = critical.filter((k) => !process.env[k]);
  const missingOptional = optional.filter((k) => !process.env[k]);

  if (missingCritical.length) issues.push(`❌ Missing critical env vars: \`${missingCritical.join('`, `')}\``);
  else passes.push('✅ All critical env vars present');

  if (!process.env.DATABASE_URL) issues.push('⚠️ `DATABASE_URL` not set — XP/levels and analytics disabled');
  if (!process.env.DISCORD_GUILD_ID) issues.push('⚠️ `DISCORD_GUILD_ID` not set — live update worker will not find your server');

  if (missingOptional.filter((k) => !['DATABASE_URL', 'DISCORD_GUILD_ID'].includes(k)).length) {
    issues.push(`⚠️ Optional APIs not configured: \`${missingOptional.filter((k) => !['DATABASE_URL','DISCORD_GUILD_ID'].includes(k)).join('`, `')}\``);
  }

  // Check roles
  try {
    const roles = await getGuildRoles(guildId);
    const genieRole = roles.find((r) => r.name.includes('Genie'));
    const maxPos = Math.max(...roles.filter((r) => r.name !== '@everyone').map((r) => r.position));

    if (!genieRole) {
      issues.push('❌ 🤖 Genie role not found — run `/setup apply`');
    } else if (genieRole.position < maxPos - 3) {
      issues.push(`⚠️ Genie role is at position ${genieRole.position}/${maxPos} — move it higher to manage all roles properly`);
    } else {
      passes.push(`✅ Genie role position OK (${genieRole.position}/${maxPos})`);
    }
  } catch (e) {
    issues.push(`⚠️ Could not check roles: ${e.message}`);
  }

  // Check channels
  try {
    const channels = await getGuildChannels(guildId);
    const staffCh = channels.find((c) => c.name.includes('admin-commands') || c.name.includes('staff-chat'));

    if (staffCh) {
      const everyoneOw = staffCh.permission_overwrites?.find((o) => o.id === guildId);
      if (everyoneOw && BigInt(everyoneOw.deny ?? 0) & VIEW_CHANNEL) {
        passes.push('✅ Staff channels are private');
      } else {
        issues.push('❌ Staff channels may be visible to @everyone — re-run `/setup apply`');
      }
    } else {
      issues.push('⚠️ Staff channels not found — run `/setup apply`');
    }
  } catch (e) {
    issues.push(`⚠️ Could not check channels: ${e.message}`);
  }

  const hasIssues = issues.some((i) => i.startsWith('❌'));

  await editOriginalResponse(token, {
    embeds: [{
      title: '🔒  Security Check Report',
      color: hasIssues ? 0xe63946 : 0x57cc99,
      fields: [
        { name: '✅ Passing', value: passes.join('\n') || 'None', inline: false },
        { name: '⚠️ Issues',  value: issues.join('\n') || 'None found', inline: false },
      ],
      footer: { text: 'Bad Genetics HQ • Genie Security Check' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function handleSetup(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'preview';
  if (sub === 'preview')        return handleSetupPreview(interaction, res);
  if (sub === 'apply')          return handleSetupApply(interaction, res);
  if (sub === 'repair')         return handleSetupRepair(interaction, res);
  if (sub === 'clean')          return handleSetupClean(interaction, res);
  if (sub === 'security-check') return handleSetupSecurityCheck(interaction, res);
  return handleSetupPreview(interaction, res);
}
