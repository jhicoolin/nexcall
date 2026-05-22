export function handleShop(_interaction, res) {
  const siteUrl = process.env.BADGENES_SITE_URL || 'https://badgenes.com';

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: 'Bad Genetics Shop',
          description: `The gear that carries the genetics.\n\n[**Shop Now →**](${siteUrl})`,
          color: 0xe63946,
          footer: { text: 'Bad Genetics HQ' },
        },
      ],
    },
  });
}
