import { handleSetup } from './commands/setup.js';
import { handleRules } from './commands/rules.js';
import { handleShop } from './commands/shop.js';
import { handleDrop } from './commands/drop.js';
import { handleGenie } from './commands/genie.js';
import { handleVip } from './commands/vip.js';
import { handleSupport } from './commands/support.js';
import { handleLevel } from './commands/level.js';
import { handleLeaderboard } from './commands/leaderboard.js';
import { handleRoutine } from './commands/routine.js';
import { handleMinigame, handleTriviaComponent } from './commands/minigame.js';
import { handleMarket } from './commands/market.js';
import { handleIdeas } from './commands/ideas.js';
import { handleEmail } from './commands/email.js';
import { handleRoles, handleRoleSelect } from './commands/roles.js';
import { handleMusic } from './commands/music.js';
import { EPHEMERAL } from './permissions.js';

const COMMAND_HANDLERS = {
  setup:       handleSetup,
  rules:       handleRules,
  shop:        handleShop,
  drop:        handleDrop,
  genie:       handleGenie,
  vip:         handleVip,
  support:     handleSupport,
  level:       handleLevel,
  leaderboard: handleLeaderboard,
  routine:     handleRoutine,
  minigame:    handleMinigame,
  market:      handleMarket,
  ideas:       handleIdeas,
  email:       handleEmail,
  roles:       handleRoles,
  music:       handleMusic,
};

export async function route(interaction, res) {
  // APPLICATION_COMMAND (type 2)
  if (interaction.type === 2) {
    const name = interaction.data?.name;
    const handler = COMMAND_HANDLERS[name];
    if (handler) return handler(interaction, res);
    return res.json({
      type: 4,
      data: { content: `Unknown command: \`/${name}\``, flags: EPHEMERAL },
    });
  }

  // MESSAGE_COMPONENT (type 3)
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id ?? '';
    if (customId.startsWith('roles:'))  return handleRoleSelect(interaction, res);
    if (customId.startsWith('trivia:')) return handleTriviaComponent(interaction, res);
    return res.json({
      type: 4,
      data: { content: 'Unknown component.', flags: EPHEMERAL },
    });
  }

  return res.json({ type: 4, data: { content: 'Unhandled interaction.', flags: EPHEMERAL } });
}
