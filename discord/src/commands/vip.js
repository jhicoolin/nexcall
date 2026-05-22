export function handleVip(_interaction, res) {
  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Bad Genetics VIP',
          description: 'VIP members get early access, exclusive drops, and direct line to the team.',
          color: 0xe63946,
          fields: [
            { name: 'Early Access', value: 'First look at every drop before it goes public.', inline: false },
            { name: 'Exclusive Channels', value: 'Access to VIP-only channels and content.', inline: false },
            { name: 'Community Status', value: 'Stand out in the server with the VIP role badge.', inline: false },
            { name: 'How to Get VIP', value: 'VIP is earned or granted by the team. Stay active and support the brand.', inline: false },
          ],
          footer: { text: 'Admin grant/revoke commands — coming in next update.' },
        },
      ],
    },
  });
}
