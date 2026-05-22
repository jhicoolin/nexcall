import { hasManageGuild, EPHEMERAL } from '../permissions.js';

function getOption(options, name) {
  return options?.find((o) => o.name === name)?.value ?? null;
}

export function handleDrop(interaction, res) {
  if (!hasManageGuild(interaction)) {
    return res.json({
      type: 4,
      data: { content: 'You need **Manage Server** permission to post drops.', flags: EPHEMERAL },
    });
  }

  const opts = interaction.data.options ?? [];
  const productName = getOption(opts, 'product_name');
  const dropDate = getOption(opts, 'drop_date');
  const link = getOption(opts, 'link');
  const imageUrl = getOption(opts, 'image_url');
  const notes = getOption(opts, 'notes');

  const embed = {
    title: `NEW DROP — ${productName}`,
    description: notes || 'A new drop just landed. Don\'t sleep.',
    color: 0xe63946,
    fields: [
      { name: 'Drop Date', value: dropDate, inline: true },
      { name: 'Shop Now', value: `[View Drop](${link})`, inline: true },
    ],
    footer: { text: 'Bad Genetics HQ' },
    timestamp: new Date().toISOString(),
  };

  if (imageUrl) embed.image = { url: imageUrl };

  return res.json({
    type: 4,
    data: {
      embeds: [embed],
      allowed_mentions: { parse: [] },
    },
  });
}
