const BRAND = 0xe63946;

export function rulesEmbed() {
  return {
    embeds: [{
      title: '📋  Bad Genetics HQ — Rules',
      description: 'Read and follow these. Violations result in warnings, mutes, or bans.',
      color: BRAND,
      fields: [
        { name: '1. Respect everyone',          value: 'No hate, harassment, bullying, or targeted attacks.',                    inline: false },
        { name: '2. No spam or scams',           value: 'No repeated messages, fake giveaways, phishing, or financial scams.',   inline: false },
        { name: '3. No NSFW or illegal content', value: 'Keep everything appropriate. No explicit, graphic, or illegal material.',inline: false },
        { name: '4. No impersonation',           value: 'Do not impersonate members, staff, brands, or public figures.',         inline: false },
        { name: '5. No unauthorized promo',      value: 'Self-promo only in approved channels. Unsolicited ads will be removed.',inline: false },
        { name: '6. Market channels are informational only', value: 'Nothing in INTEL is financial advice.',                    inline: false },
        { name: '7. Fitness content is general guidance',    value: 'Routines are educational only — not medical advice.',       inline: false },
        { name: '8. Follow Discord ToS',         value: '[Terms](https://discord.com/terms) and [Guidelines](https://discord.com/guidelines) apply at all times.', inline: false },
        { name: '9. Staff has final say',         value: 'Do not argue with mods in public. DM staff for disputes.',            inline: false },
        { name: '10. Stay locked in',            value: 'Keep the server clean, focused, and on brand.',                        inline: false },
      ],
      footer: { text: 'Bad Genetics HQ • Breaking rules = action taken' },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function welcomeEmbed() {
  const url = process.env.BADGENES_SITE_URL || 'https://nexcall.one';
  return {
    embeds: [{
      title: '🧬  Welcome to Bad Genetics HQ',
      description: `The official community for **Bad Genetics** — built for people who train hard, dress different, and carry themselves like it.\n\nInstagram: **@badgenetic**\nShop: [${url}](${url})`,
      color: BRAND,
      fields: [
        { name: 'Get Started', value: '1. Read ✅┃rules\n2. Grab roles in 🎭┃roles\n3. Introduce yourself in 💬┃general\n4. Check 🔥┃drops for the latest', inline: false },
        { name: 'Need Help?',  value: 'Post in ❓┃support or use `/support`', inline: false },
      ],
      footer: { text: 'Bad Genetics HQ • @badgenetic' },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function shopEmbed() {
  const url = process.env.BADGENES_SITE_URL || 'https://nexcall.one';
  return {
    embeds: [{
      title: '🛒  Bad Genetics Shop',
      description: `The gear that carries the genetics.\n\n[**Shop BadGenes →**](${url})`,
      color: BRAND,
      fields: [
        { name: 'Drop Alerts',  value: 'Grab the 🔥 Drop Alerts role in 🎭┃roles to be first on every drop.', inline: false },
        { name: 'Follow Us',    value: '[@badgenetic](https://instagram.com/badgenetic) on Instagram', inline: false },
      ],
      footer: { text: 'Bad Genetics HQ' },
      timestamp: new Date().toISOString(),
    }],
  };
}

export function roleMenuMessages(roleMap) {
  function opt(name, description) {
    const id = roleMap.get(name);
    if (!id) return null;
    return { label: name, value: id, description };
  }

  const fitnessOptions = [
    opt('🟥 Bulking',       'Building mass'),
    opt('🍎 Maintaining',   'Steady state'),
    opt('🥶 Cutting',       'Losing fat'),
    opt('🍀 Recomposition', 'Build muscle, lose fat simultaneously'),
  ].filter(Boolean);

  const trainingOptions = [
    opt('💪 Bodybuilding', 'Aesthetics and hypertrophy'),
    opt('🏋️ Powerlifting', 'Strength and total'),
    opt('🤸 Calisthenics', 'Bodyweight movement'),
    opt('🥋 Martial Arts', 'Combat and fighting arts'),
    opt('🏃 Cardio',       'Endurance and conditioning'),
    opt('🏠 Home Gym',     'Training from home'),
  ].filter(Boolean);

  const notifyOptions = [
    opt('🔥 Drop Alerts',     'New product drops — first to know'),
    opt('📣 Event Alerts',    'Server events and challenges'),
    opt('🏋️ Training Alerts', 'New routines and fitness content'),
    opt('📈 Market Alerts',   'Brand intel and market updates'),
    opt('🎮 Minigames',       'Game announcements and challenges'),
  ].filter(Boolean);

  const messages = [];

  messages.push({
    embeds: [{
      title: '🎭  Role Selection',
      description: 'Pick your fitness goal, training style, and notification preferences.\nYou can change these anytime.',
      color: BRAND,
      footer: { text: 'Bad Genetics HQ • Role Menu' },
    }],
  });

  const rows = [];
  if (fitnessOptions.length) {
    rows.push({ type: 1, components: [{ type: 3, custom_id: 'roles:fitness', placeholder: '🟥 Fitness goal (pick one)', min_values: 0, max_values: 1, options: fitnessOptions }] });
  }
  if (trainingOptions.length) {
    rows.push({ type: 1, components: [{ type: 3, custom_id: 'roles:training', placeholder: '💪 Training styles (pick all that apply)', min_values: 0, max_values: trainingOptions.length, options: trainingOptions }] });
  }
  if (notifyOptions.length) {
    rows.push({ type: 1, components: [{ type: 3, custom_id: 'roles:notify', placeholder: '🔔 Notification roles', min_values: 0, max_values: notifyOptions.length, options: notifyOptions }] });
  }

  if (rows.length) {
    messages.push({
      embeds: [{ title: '🏋️  Training & Notifications', description: 'Set your preferences below.', color: BRAND }],
      components: rows,
    });
  }

  return messages;
}
