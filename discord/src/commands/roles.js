import { hasManageGuild, EPHEMERAL } from '../permissions.js';
import { getGuildRoles, getGuildChannels, sendMessage, addMemberRole, removeMemberRole } from '../discordApi.js';
import { ROLE_GROUPS, EXCLUSIVE_GROUPS } from '../roleStructure.js';
import { roleMenuMessages } from '../embeds.js';

// /roles — re-post the role menu to get-roles channel (admin only)
export async function handleRoles(interaction, res) {
  if (!hasManageGuild(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Manage Server** permission to repost the role menu.', flags: EPHEMERAL },
    });
  }

  res.json({ type: 5 });

  const guildId = interaction.guild_id;
  const token   = interaction.token;

  try {
    const [guildRoles, guildChannels] = await Promise.all([
      getGuildRoles(guildId),
      getGuildChannels(guildId),
    ]);

    const roleMap = new Map(guildRoles.map((r) => [r.name, r.id]));
    const getRolesChannel = guildChannels.find((c) => c.name === '🎭┃get-roles');

    if (!getRolesChannel) {
      const { editOriginalResponse } = await import('../discordApi.js');
      return editOriginalResponse(token, {
        content: 'Could not find **🎭┃get-roles** channel. Run `/setup apply` first.',
      });
    }

    const msgs = roleMenuMessages(roleMap);
    for (const msg of msgs) {
      await sendMessage(getRolesChannel.id, msg);
    }

    const { editOriginalResponse } = await import('../discordApi.js');
    await editOriginalResponse(token, {
      content: '✅ Role menu posted in 🎭┃get-roles.',
    });
  } catch (err) {
    console.error('Roles error:', err);
    const { editOriginalResponse } = await import('../discordApi.js');
    await editOriginalResponse(token, { content: `Failed: ${err.message}` }).catch(() => {});
  }
}

// Handle select menu interactions from the role menu (type 3 components)
export async function handleRoleSelect(interaction, res) {
  const guildId  = interaction.guild_id;
  const userId   = interaction.member?.user?.id;
  const customId = interaction.data.custom_id; // 'roles:fitness' | 'roles:training' | 'roles:notify'
  const selected = interaction.data.values ?? []; // array of role IDs
  const userRoles = new Set(interaction.member?.roles ?? []);

  const groupName = customId.split(':')[1]; // 'fitness' | 'training' | 'notify'

  // Map group name to ROLE_GROUPS key
  const groupMap = {
    fitness: 'fitness',
    training: 'training',
    notify: 'notifications',
  };

  const roleGroupKey = groupMap[groupName];
  if (!roleGroupKey) {
    return res.json({
      type: 4,
      data: { content: 'Unknown role group.', flags: EPHEMERAL },
    });
  }

  try {
    const guildRoles = await getGuildRoles(guildId);
    const roleNameToId = new Map(guildRoles.map((r) => [r.name, r.id]));

    // Get all role IDs that belong to this group
    const groupRoleIds = new Set(
      (ROLE_GROUPS[roleGroupKey] ?? [])
        .map((r) => roleNameToId.get(r.name))
        .filter(Boolean)
    );

    const selectedSet = new Set(selected);

    // For exclusive groups (fitness), remove all group roles first
    const isExclusive = EXCLUSIVE_GROUPS.has(groupName);
    const toRemove = [...groupRoleIds].filter((id) =>
      userRoles.has(id) && (isExclusive || !selectedSet.has(id))
    );
    const toAdd = selected.filter((id) => !userRoles.has(id) && groupRoleIds.has(id));

    await Promise.all([
      ...toRemove.map((id) => removeMemberRole(guildId, userId, id).catch(() => {})),
      ...toAdd.map((id) => addMemberRole(guildId, userId, id).catch(() => {})),
    ]);

    const addedNames  = toAdd.map((id) => guildRoles.find((r) => r.id === id)?.name).filter(Boolean);
    const removedNames = toRemove.map((id) => guildRoles.find((r) => r.id === id)?.name).filter(Boolean);

    let msg = '';
    if (addedNames.length)   msg += `✅ Added: ${addedNames.join(', ')}\n`;
    if (removedNames.length) msg += `➖ Removed: ${removedNames.join(', ')}\n`;
    if (!msg) msg = 'No changes made.';

    return res.json({
      type: 4,
      data: { content: msg.trim(), flags: EPHEMERAL },
    });
  } catch (err) {
    console.error('Role select error:', err);
    return res.json({
      type: 4,
      data: { content: 'Role update failed. Try again.', flags: EPHEMERAL },
    });
  }
}
