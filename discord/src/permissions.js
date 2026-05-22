const ADMINISTRATOR   = 1n << 3n;
const MANAGE_GUILD    = 1n << 5n;
const MANAGE_CHANNELS = 1n << 4n;

export const EPHEMERAL     = 64;
export const VIEW_CHANNEL  = 1024n;
export const SEND_MESSAGES = 2048n;

function rawPerms(interaction) {
  return BigInt(interaction.member?.permissions ?? '0');
}

function getUserId(interaction) {
  return interaction.member?.user?.id ?? interaction.user?.id ?? '';
}

// Full admin check: Discord permissions OR configured role ID OR owner list
export function isAdmin(interaction) {
  const perms = rawPerms(interaction);
  if ((perms & ADMINISTRATOR) === ADMINISTRATOR) return true;
  if ((perms & MANAGE_GUILD)  === MANAGE_GUILD)  return true;

  const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;
  const memberRoles = interaction.member?.roles ?? [];
  if (adminRoleId && memberRoles.includes(adminRoleId)) return true;

  const modRoleId = process.env.DISCORD_MOD_ROLE_ID;
  if (modRoleId && memberRoles.includes(modRoleId)) return true;

  const ownerIds = (process.env.BOT_OWNER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ownerIds.length && ownerIds.includes(getUserId(interaction))) return true;

  return false;
}

// Alias — widely used
export function hasManageGuild(interaction) {
  return isAdmin(interaction);
}

export function hasManageChannels(interaction) {
  const perms = rawPerms(interaction);
  return (perms & ADMINISTRATOR) === ADMINISTRATOR ||
         (perms & MANAGE_CHANNELS) === MANAGE_CHANNELS ||
         isAdmin(interaction);
}

// Standard ephemeral "no permission" reply
export function noPermission(res) {
  return res.json({
    type: 4,
    data: { content: 'You need **Administrator** or **Manage Server** permission for this command.', flags: EPHEMERAL },
  });
}
