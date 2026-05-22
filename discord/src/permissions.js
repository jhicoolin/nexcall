const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;
const MANAGE_CHANNELS = 1n << 4n;

export function memberPermissions(interaction) {
  const raw = interaction.member?.permissions ?? '0';
  return BigInt(raw);
}

export function isAdmin(interaction) {
  const perms = memberPermissions(interaction);
  return (perms & ADMINISTRATOR) === ADMINISTRATOR;
}

export function hasManageGuild(interaction) {
  const perms = memberPermissions(interaction);
  return (
    (perms & ADMINISTRATOR) === ADMINISTRATOR ||
    (perms & MANAGE_GUILD) === MANAGE_GUILD
  );
}

export function hasManageChannels(interaction) {
  const perms = memberPermissions(interaction);
  return (
    (perms & ADMINISTRATOR) === ADMINISTRATOR ||
    (perms & MANAGE_CHANNELS) === MANAGE_CHANNELS
  );
}

export const EPHEMERAL = 64;
