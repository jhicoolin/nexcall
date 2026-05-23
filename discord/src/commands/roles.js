import { hasManageGuild, isAdmin, EPHEMERAL } from '../permissions.js';
import { getGuildRoles, getGuildChannels, sendMessage, editOriginalResponse, addMemberRole, removeMemberRole } from '../discordApi.js';
import { ROLE_GROUPS, EXCLUSIVE_GROUPS } from '../roleStructure.js';
import { roleMenuMessages } from '../embeds.js';

// Role channel name matches new compact layout
const ROLES_CHANNEL = '🎭┃roles';

// /roles — re-post the role menu (admin only)
export async function handleRoles(interaction, res) {
  if (!isAdmin(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Administrator** or **Manage Server** permission.', flags: EPHEMERAL },
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

    const roleMap      = new Map(guildRoles.map((r) => [r.name, r.id]));
    const rolesChannel = guildChannels.find((c) => c.name === ROLES_CHANNEL);

    if (!rolesChannel) {
      return editOriginalResponse(token, {
        content: `Could not find **${ROLES_CHANNEL}** channel. Run \`/setup apply\` first.`,
      });
    }

    const msgs = roleMenuMessages(roleMap);
    for (const msg of msgs) {
      await sendMessage(rolesChannel.id, msg);
    }

    await editOriginalResponse(token, {
      content: `✅ Role menu posted in ${ROLES_CHANNEL}.`,
    });
  } catch (err) {
    console.error('Roles error:', err);
    await editOriginalResponse(token, { content: `Failed: ${err.message}` }).catch(() => {});
  }
}

// Handle select menu interactions from the role menu (MESSAGE_COMPONENT type 3)
// Re-checks admin NOT required here — this is a member action.
// The role menu is only interactive for role assignment, not admin ops.
export async function handleRoleSelect(interaction, res) {
  const guildId   = interaction.guild_id;
  const userId    = interaction.member?.user?.id;
  const customId  = interaction.data.custom_id;
  const selected  = interaction.data.values ?? [];
  const userRoles = new Set(interaction.member?.roles ?? []);

  if (!userId) {
    return res.json({ type: 4, data: { content: 'Could not identify user.', flags: EPHEMERAL } });
  }

  const groupName = customId.split(':')[1];
  const groupMap  = { fitness: 'fitness', training: 'training', notify: 'notifications' };
  const roleGroupKey = groupMap[groupName];

  if (!roleGroupKey) {
    return res.json({ type: 4, data: { content: 'Unknown role group.', flags: EPHEMERAL } });
  }

  try {
    const guildRoles   = await getGuildRoles(guildId);
    const roleNameToId = new Map(guildRoles.map((r) => [r.name, r.id]));

    const groupRoleIds = new Set(
      (ROLE_GROUPS[roleGroupKey] ?? []).map((r) => roleNameToId.get(r.name)).filter(Boolean)
    );

    const selectedSet  = new Set(selected);
    const isExclusive  = EXCLUSIVE_GROUPS.has(groupName);
    const toRemove     = [...groupRoleIds].filter((id) => userRoles.has(id) && (isExclusive || !selectedSet.has(id)));
    const toAdd        = selected.filter((id) => !userRoles.has(id) && groupRoleIds.has(id));

    await Promise.all([
      ...toRemove.map((id) => removeMemberRole(guildId, userId, id).catch(() => {})),
      ...toAdd.map((id)    => addMemberRole(guildId, userId, id).catch(() => {})),
    ]);

    const addedNames   = toAdd.map((id)    => guildRoles.find((r) => r.id === id)?.name).filter(Boolean);
    const removedNames = toRemove.map((id) => guildRoles.find((r) => r.id === id)?.name).filter(Boolean);

    let msg = '';
    if (addedNames.length)   msg += `✅ Added: ${addedNames.join(', ')}\n`;
    if (removedNames.length) msg += `➖ Removed: ${removedNames.join(', ')}\n`;
    if (!msg) msg = 'No changes made.';

    return res.json({ type: 4, data: { content: msg.trim(), flags: EPHEMERAL } });
  } catch (err) {
    console.error('Role select error:', err);
    return res.json({ type: 4, data: { content: 'Role update failed. Try again.', flags: EPHEMERAL } });
  }
}
