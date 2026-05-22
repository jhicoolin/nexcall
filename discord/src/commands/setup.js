import { hasManageGuild, EPHEMERAL } from '../permissions.js';
import {
  getGuildChannels, createChannel,
  getGuildRoles, createRole,
  sendMessage,
  editOriginalResponse, delay,
} from '../discordApi.js';
import { SERVER_STRUCTURE } from '../serverStructure.js';
import { ALL_ROLES, ROLE_GROUPS } from '../roleStructure.js';
import { rulesEmbed, welcomeEmbed, roleMenuMessages } from '../embeds.js';

const SEND_MESSAGES = 2048n;
const VIEW_CHANNEL  = 1024n;

function readonlyOverwrites(guildId) {
  return [
    {
      id: guildId,
      type: 0,
      allow: String(VIEW_CHANNEL),
      deny: String(SEND_MESSAGES),
    },
  ];
}

// ── Preview ───────────────────────────────────────────────────────────────────

export function handleSetupPreview(_interaction, res) {
  const categories = SERVER_STRUCTURE.map((s) => s.category);
  const totalChannels = SERVER_STRUCTURE.reduce((n, s) => n + s.channels.length, 0);
  const totalRoles = ALL_ROLES.length;

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Setup Preview — Bad Genetics HQ',
          description: `Run \`/setup apply\` to build this layout.\n\n**${categories.length} categories • ${totalChannels} channels • ${totalRoles} roles**`,
          color: 0xe63946,
          fields: [
            {
              name: 'Categories',
              value: categories.join('\n'),
              inline: true,
            },
            {
              name: 'Role Groups',
              value: Object.entries(ROLE_GROUPS)
                .map(([g, roles]) => `**${g}** (${roles.length})`)
                .join('\n'),
              inline: true,
            },
            {
              name: 'Embeds Posted',
              value: '✅ rules\n👋 welcome\n🎭 role menu',
              inline: true,
            },
          ],
          footer: { text: 'Bad Genetics HQ • Genie — preview only, nothing created' },
        },
      ],
      flags: EPHEMERAL,
    },
  });
}

// ── Apply ─────────────────────────────────────────────────────────────────────

export async function handleSetupApply(interaction, res) {
  if (!hasManageGuild(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Manage Server** permission to run `/setup apply`.', flags: EPHEMERAL },
    });
  }

  res.json({ type: 5 }); // deferred

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    // ── 1. Roles ──────────────────────────────────────────────────────────────
    const existingRoles = await getGuildRoles(guildId);
    const existingRoleNames = new Set(existingRoles.map((r) => r.name));
    const roleMap = new Map(existingRoles.map((r) => [r.name, r.id]));
    let rolesCreated = 0;

    for (const role of ALL_ROLES) {
      if (!existingRoleNames.has(role.name)) {
        const created = await createRole(guildId, {
          name: role.name,
          color: role.color ?? 0,
          hoist: role.hoist ?? false,
          mentionable: false,
        });
        roleMap.set(role.name, created.id);
        rolesCreated++;
        await delay(300);
      }
    }

    // ── 2. Channels ───────────────────────────────────────────────────────────
    const existingChannels = await getGuildChannels(guildId);
    const byNameType = new Map(existingChannels.map((c) => [`${c.name}:${c.type}`, c]));
    const channelIdMap = new Map(existingChannels.map((c) => [c.name, c.id]));
    let channelsCreated = 0;

    for (const { category, channels } of SERVER_STRUCTURE) {
      let categoryId;
      const catKey = `${category}:4`;

      if (byNameType.has(catKey)) {
        categoryId = byNameType.get(catKey).id;
      } else {
        const cat = await createChannel(guildId, { name: category, type: 4 });
        categoryId = cat.id;
        channelsCreated++;
        await delay(300);
      }

      for (const ch of channels) {
        const chKey = `${ch.name}:${ch.type}`;
        if (!byNameType.has(chKey)) {
          const created = await createChannel(guildId, {
            name: ch.name,
            type: ch.type,
            parent_id: categoryId,
            permission_overwrites: ch.readonly ? readonlyOverwrites(guildId) : [],
          });
          channelIdMap.set(ch.name, created.id);
          channelsCreated++;
          await delay(300);
        }
      }
    }

    // ── 3. Post embeds ────────────────────────────────────────────────────────
    let embedsPosted = 0;

    for (const { channels } of SERVER_STRUCTURE) {
      for (const ch of channels) {
        const channelId = channelIdMap.get(ch.name);
        if (!channelId || !ch.postEmbed) continue;

        try {
          if (ch.postEmbed === 'rules') {
            await sendMessage(channelId, rulesEmbed());
            embedsPosted++;
          } else if (ch.postEmbed === 'welcome') {
            await sendMessage(channelId, welcomeEmbed());
            embedsPosted++;
          } else if (ch.postEmbed === 'roles') {
            const msgs = roleMenuMessages(roleMap);
            for (const msg of msgs) {
              await sendMessage(channelId, msg);
              await delay(300);
            }
            embedsPosted++;
          }
        } catch (embedErr) {
          console.error(`Failed to post embed in ${ch.name}:`, embedErr);
        }

        await delay(300);
      }
    }

    await editOriginalResponse(token, {
      embeds: [
        {
          title: '✅  Bad Genetics HQ Setup Complete',
          description: 'Server structure, roles, and embeds are live.',
          color: 0xe63946,
          fields: [
            { name: 'Roles Created',    value: String(rolesCreated),    inline: true },
            { name: 'Channels Created', value: String(channelsCreated), inline: true },
            { name: 'Embeds Posted',    value: String(embedsPosted),    inline: true },
          ],
          footer: { text: 'Bad Genetics HQ • Genie' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    console.error('Setup error:', err);
    await editOriginalResponse(token, {
      content: `Setup hit an error: ${err.message}\n\nMake sure Genie has **Administrator** permission and is placed high in the role list.`,
    }).catch(() => {});
  }
}

// ── Repair ────────────────────────────────────────────────────────────────────

export async function handleSetupRepair(interaction, res) {
  if (!hasManageGuild(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Manage Server** permission.', flags: EPHEMERAL },
    });
  }

  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    const [existingRoles, existingChannels] = await Promise.all([
      getGuildRoles(guildId),
      getGuildChannels(guildId),
    ]);

    const existingRoleNames = new Set(existingRoles.map((r) => r.name));
    const existingChannelNames = new Set(existingChannels.map((c) => c.name));

    const missingRoles    = ALL_ROLES.filter((r) => !existingRoleNames.has(r.name));
    const missingChannels = SERVER_STRUCTURE.flatMap((s) =>
      s.channels.filter((c) => !existingChannelNames.has(c.name)).map((c) => c.name)
    );

    await editOriginalResponse(token, {
      embeds: [
        {
          title: '🔧  Repair Report',
          color: 0xe63946,
          fields: [
            {
              name: 'Missing Roles',
              value: missingRoles.length > 0
                ? missingRoles.map((r) => r.name).join('\n')
                : '✅ All roles present',
              inline: true,
            },
            {
              name: 'Missing Channels',
              value: missingChannels.length > 0
                ? missingChannels.slice(0, 20).join('\n')
                : '✅ All channels present',
              inline: true,
            },
          ],
          footer: { text: 'Run /setup apply to fix missing items.' },
        },
      ],
    });
  } catch (err) {
    console.error('Repair error:', err);
    await editOriginalResponse(token, { content: `Repair check failed: ${err.message}` }).catch(() => {});
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function handleSetup(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'apply';
  if (sub === 'preview') return handleSetupPreview(interaction, res);
  if (sub === 'repair')  return handleSetupRepair(interaction, res);
  return handleSetupApply(interaction, res);
}
