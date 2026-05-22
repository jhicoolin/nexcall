export function handleSupport(_interaction, res) {
  const siteUrl = process.env.BADGENES_SITE_URL || 'https://nexcall.one';

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Bad Genetics Support',
          description: 'Need help? Here\'s how to reach us.',
          color: 0xe63946,
          fields: [
            { name: 'Order Issues', value: `Head to [${siteUrl}](${siteUrl}) and use the contact form.`, inline: false },
            { name: 'Server Support', value: 'Post in <#support> or <#order-help> and a mod will assist you.', inline: false },
            { name: 'FAQ', value: 'Check <#faq> — most questions are already answered there.', inline: false },
            { name: 'Direct Contact', value: `[Contact Us](${siteUrl}/contact)`, inline: false },
          ],
          footer: { text: 'Ticket system coming in Phase 2.' },
        },
      ],
      flags: 64,
    },
  });
}
