export function handleRules(_interaction, res) {
  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Bad Genetics HQ — Server Rules',
          description:
            'Read and respect these rules. Violations result in warnings, mutes, or bans.',
          color: 0xe63946,
          fields: [
            { name: '1. No Spam', value: 'No repeated messages, emoji walls, or flooding channels.', inline: false },
            { name: '2. No Scams or Fraud', value: 'No fake giveaways, phishing links, or financial scams of any kind.', inline: false },
            { name: '3. No Harassment', value: 'Treat everyone with respect. No targeted harassment, hate speech, or bullying.', inline: false },
            { name: '4. No Illegal Content', value: 'Do not share or promote illegal material, activities, or substances.', inline: false },
            { name: '5. No Impersonation', value: 'Do not impersonate members, staff, brands, or public figures.', inline: false },
            { name: '6. No NSFW Content', value: 'Keep all content appropriate. No explicit, graphic, or adult material.', inline: false },
            { name: '7. No Fake Giveaways', value: 'Only legitimate, approved giveaways from admins are allowed.', inline: false },
            { name: '8. No Financial Advice', value: 'Crypto and market discussion is informational only. Do not solicit or give financial advice.', inline: false },
            { name: '9. Respect Discord ToS', value: 'All Discord [Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines) apply at all times.', inline: false },
            { name: '10. Follow Staff Directions', value: 'Moderators and admins have final say. If you have a dispute, DM a mod — do not argue in channels.', inline: false },
          ],
          footer: { text: 'Bad Genetics HQ • Breaking rules = enforcement action' },
        },
      ],
    },
  });
}
