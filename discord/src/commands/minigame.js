import { checkCooldown } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';

const TRIVIA = [
  { q: 'How many calories are in 1 gram of protein?', a: '4', choices: ['2', '4', '7', '9'], correct: 1 },
  { q: 'Which muscle group does a deadlift primarily target?', a: 'Posterior chain (hamstrings, glutes, back)', choices: ['Chest', 'Quads', 'Posterior chain', 'Shoulders'], correct: 2 },
  { q: 'What does RPE stand for in training?', a: 'Rate of Perceived Exertion', choices: ['Reps Per Exercise', 'Rate of Perceived Exertion', 'Rest Period Estimate', 'Resistance Per Element'], correct: 1 },
  { q: 'How many grams of protein are in 100g of chicken breast (approx)?', a: '31g', choices: ['15g', '22g', '31g', '45g'], correct: 2 },
  { q: 'What is a "superset" in weight training?', a: 'Two exercises performed back-to-back with no rest', choices: ['A set with extra weight', 'Two exercises back-to-back', 'A 10-minute workout', 'Three sets in a row'], correct: 1 },
  { q: 'What does DOMS stand for?', a: 'Delayed Onset Muscle Soreness', choices: ['Daily Output Muscle Stimulus', 'Delayed Onset Muscle Soreness', 'Direct Output Muscle Strength', 'Dynamic Output Movement System'], correct: 1 },
  { q: 'Which vitamin is primarily synthesized through sun exposure?', a: 'Vitamin D', choices: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correct: 3 },
  { q: 'What is the primary fuel source during high-intensity exercise?', a: 'Carbohydrates (glycogen)', choices: ['Fat', 'Protein', 'Carbohydrates', 'Creatine'], correct: 2 },
];

const DAILY_CHALLENGES = [
  '100 push-ups throughout the day. Track your sets.',
  'Hold a plank for a cumulative 5 minutes today.',
  'Walk or run at least 10,000 steps.',
  '50 bodyweight squats every hour for 5 hours.',
  'No sugar today. Full clean eating.',
  'Cold shower first thing this morning.',
  'Stretch for 15 minutes before bed tonight.',
  'Hit your daily protein goal — track every meal.',
  '200 calf raises spread throughout the day.',
  'No phone for the first hour after waking up.',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDayIndex() {
  return Math.floor(Date.now() / 86_400_000) % DAILY_CHALLENGES.length;
}

export function handleMinigame(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? '';
  const userId = interaction.member?.user?.id ?? interaction.user?.id ?? 'anon';

  const cd = checkCooldown(userId, `minigame-${sub}`, 5);
  if (!cd.allowed) {
    return res.json({
      type: 4,
      data: { content: `Slow down! Try again in ${cd.retryAfter}s.`, flags: EPHEMERAL },
    });
  }

  switch (sub) {
    case 'coinflip': {
      const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Coin Flip',
              description: `The coin landed on... **${result}**!`,
              color: result === 'Heads' ? 0xffd166 : 0x57cc99,
              footer: { text: 'Bad Genetics HQ • Minigames' },
            },
          ],
        },
      });
    }

    case 'trivia': {
      const item = pickRandom(TRIVIA);
      const choiceLabels = ['A', 'B', 'C', 'D'];
      const components = [
        {
          type: 1,
          components: item.choices.map((choice, i) => ({
            type: 2,
            style: 2,
            label: `${choiceLabels[i]}: ${choice}`,
            custom_id: `trivia:${i}:${item.correct}`,
          })),
        },
      ];
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Fitness Trivia',
              description: `**${item.q}**`,
              color: 0xe63946,
              footer: { text: 'Select an answer below.' },
            },
          ],
          components,
        },
      });
    }

    case 'guess': {
      const guess = interaction.data.options?.[0]?.options?.find((o) => o.name === 'number')?.value ?? 0;
      const clamped = Math.max(1, Math.min(100, Number(guess)));
      const secret = Math.floor(Math.random() * 100) + 1;
      const diff = Math.abs(clamped - secret);
      let result;
      if (diff === 0) result = `PERFECT! You guessed exactly **${secret}**!`;
      else if (diff <= 5) result = `So close! The number was **${secret}**. Your guess: **${clamped}** (off by ${diff}).`;
      else if (diff <= 15) result = `Not bad. The number was **${secret}**. Your guess: **${clamped}** (off by ${diff}).`;
      else result = `Way off. The number was **${secret}**. Your guess: **${clamped}** (off by ${diff}).`;

      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: 'Guess The Number',
              description: result,
              color: diff === 0 ? 0x57cc99 : 0xe63946,
              footer: { text: 'Bad Genetics HQ • Minigames' },
            },
          ],
        },
      });
    }

    case 'daily': {
      const challenge = DAILY_CHALLENGES[getDayIndex()];
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: "Today's Daily Challenge",
              description: `**${challenge}**`,
              color: 0xe63946,
              footer: { text: 'Challenge resets daily at midnight UTC.' },
            },
          ],
        },
      });
    }

    default:
      return res.json({ type: 4, data: { content: 'Unknown minigame.', flags: EPHEMERAL } });
  }
}

export function handleTriviaComponent(interaction, res) {
  const [, guessStr, correctStr] = interaction.data.custom_id.split(':');
  const guess = Number(guessStr);
  const correct = Number(correctStr);
  const isCorrect = guess === correct;

  return res.json({
    type: 7,
    data: {
      embeds: [
        {
          title: isCorrect ? 'Correct!' : 'Wrong Answer',
          description: isCorrect
            ? 'You nailed it. Knowledge is gains.'
            : `Not quite. The correct answer was option **${['A', 'B', 'C', 'D'][correct]}**.`,
          color: isCorrect ? 0x57cc99 : 0xe63946,
        },
      ],
      components: [],
    },
  });
}
