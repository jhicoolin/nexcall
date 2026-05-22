// Embed and component builders for rules, welcome, and role menus.

const BRAND_COLOR = 0xe63946;
const GOLD = 0xFFD700;

export function rulesEmbed() {
  return {
    embeds: [
      {
        title: '📋  Bad Genetics HQ — Server Rules',
        description: 'Read these. Violations result in warnings, mutes, or bans. No exceptions.',
        color: BRAND_COLOR,
        fields: [
          { name: '1. Respect everyone', value: 'No hate speech, harassment, bullying, or targeted attacks.', inline: false },
          { name: '2. No spam, scams, or phishing', value: 'No repeated messages, fake giveaways, phishing links, or financial scams.', inline: false },
          { name: '3. No NSFW or illegal content', value: 'Keep everything appropriate. No explicit, graphic, or illegal material.', inline: false },
          { name: '4. No impersonation', value: 'Do not impersonate members, staff, brands, or public figures.', inline: false },
          { name: '5. No unauthorized self-promo', value: 'Promotion only in 📣┃self-promo. Unsolicited ads elsewhere will be removed.', inline: false },
          { name: '6. Market channels are informational only', value: 'Nothing in 【📊】MARKET INTEL is financial advice. Do not give or take it as such.', inline: false },
          { name: '7. Fitness content is general guidance', value: 'Routines and advice are educational only — not medical advice. Consult a professional.', inline: false },
          { name: '8. Follow Discord ToS and Guidelines', value: '[Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines) apply at all times.', inline: false },
          { name: '9. Staff has final say', value: 'Do not argue with moderators in public channels. DM staff if you have concerns.', inline: false },
          { name: '10. Stay locked in', value: 'Keep the server clean, focused, and on-brand. We\'re building something real here.', inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • Violations = action taken' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function welcomeEmbed(siteUrl) {
  const url = siteUrl || process.env.BADGENES_SITE_URL || 'https://nexcall.one';
  return {
    embeds: [
      {
        title: '🧬  Welcome to Bad Genetics HQ',
        description: `The official community for **Bad Genetics** — built for those who train hard, dress different, and carry themselves like it.\n\nFollow us on Instagram: **@badgenetic**\nShop: [${url}](${url})`,
        color: BRAND_COLOR,
        fields: [
          { name: 'Get Started', value: '1. Read ✅┃rules\n2. Grab your roles in 🎭┃get-roles\n3. Introduce yourself in 💬┃general\n4. Browse the drop in 🔥┃drops', inline: false },
          { name: 'Need Help?', value: 'Post in ❓┃ask-staff or use `/support`', inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • @badgenetic' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// Build role menu messages using actual role IDs from setup.
// roleMap: Map<roleName, roleId>
export function roleMenuMessages(roleMap) {
  function opt(name, description) {
    const id = roleMap.get(name);
    if (!id) return null;
    return { label: name, value: id, description };
  }

  const fitnessOptions = [
    opt('🟥 Bulking', 'Building mass'),
    opt('🍎 Maintaining', 'Staying steady'),
    opt('🥶 Cutting', 'Losing fat'),
    opt('🍀 Recomposition', 'Build muscle, lose fat'),
  ].filter(Boolean);

  const trainingOptions = [
    opt('💪 Bodybuilding', 'Aesthetics and hypertrophy'),
    opt('🏋️ Powerlifting', 'Strength and total'),
    opt('🥋 Martial Arts', 'Combat and fighting arts'),
    opt('🏃 Cardio', 'Endurance and conditioning'),
    opt('🧘 Mobility', 'Flexibility and recovery'),
    opt('🏠 Home Gym', 'Training from home'),
    opt('🤸 Calisthenics', 'Bodyweight movement'),
  ].filter(Boolean);

  const notifyOptions = [
    opt('🧢 Drop Alerts', 'New product drops'),
    opt('📣 Event Alerts', 'Server events and challenges'),
    opt('🏋️ Training Alerts', 'New routines and content'),
    opt('📈 Market Alerts', 'Brand intel and market updates'),
    opt('🎮 Minigames', 'Minigame announcements'),
  ].filter(Boolean);

  const messages = [];

  // Message 1: header
  messages.push({
    embeds: [{
      title: '🎭  Role Selection',
      description: 'Pick your fitness goal, training style, and notification preferences below.\n\nYou can update these anytime.',
      color: BRAND_COLOR,
      footer: { text: 'Bad Genetics HQ • Role Menu' },
    }],
  });

  // Message 2: fitness goals + training style
  const rows2 = [];
  if (fitnessOptions.length > 0) {
    rows2.push({
      type: 1,
      components: [{
        type: 3,
        custom_id: 'roles:fitness',
        placeholder: '🟥 Pick your fitness goal (choose one)',
        min_values: 0,
        max_values: 1,
        options: fitnessOptions,
      }],
    });
  }
  if (trainingOptions.length > 0) {
    rows2.push({
      type: 1,
      components: [{
        type: 3,
        custom_id: 'roles:training',
        placeholder: '💪 Pick your training styles (pick all that apply)',
        min_values: 0,
        max_values: trainingOptions.length,
        options: trainingOptions,
      }],
    });
  }
  if (rows2.length > 0) {
    messages.push({
      embeds: [{
        title: '💪  Training Profile',
        description: 'What are you working toward?',
        color: BRAND_COLOR,
      }],
      components: rows2,
    });
  }

  // Message 3: notifications
  if (notifyOptions.length > 0) {
    messages.push({
      embeds: [{
        title: '🔔  Notifications',
        description: 'What do you want to be notified about?',
        color: BRAND_COLOR,
      }],
      components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: 'roles:notify',
          placeholder: '🔔 Pick notification roles',
          min_values: 0,
          max_values: notifyOptions.length,
          options: notifyOptions,
        }],
      }],
    });
  }

  return messages;
}
