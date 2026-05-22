const DISCLAIMER = '> **Disclaimer:** General education only — not medical advice. Consult a qualified professional before starting any exercise or diet program.';

const ROUTINES = {
  calisthenics: {
    title: '🤸 Calisthenics Routine',
    warmup: '5–10 min: jumping jacks, arm circles, hip rotations, leg swings, light jog.',
    workout: '3×10–15 Push-ups\n3×5–8 Pull-ups (or Australian rows)\n3×10 Dips\n3×15 Bodyweight squats\n3×12 Reverse lunges\n3×30s Plank + 3×15 Hollow body rocks',
    progression: 'Add 1–2 reps per session. At the top of the range, add sets, then advance to harder variations.',
    recovery: '3–4 days/week. 24–48h rest between sessions.',
    nutrition: '0.7–1g protein/lb. Time carbs around training.',
  },
  beginner: {
    title: '🏋️ Beginner Gym (3 days/week)',
    warmup: '5 min treadmill. 2 warm-up sets at 50% before working sets.',
    workout: 'Barbell Squat 3×5\nBench Press 3×5\nBarbell Row 3×5\nOverhead Press 3×5\nDeadlift 1×5 (once/week)',
    progression: 'Add 5 lbs / 2.5 kg every session. Deload 10% after 3 consecutive failures.',
    recovery: 'Mon/Wed/Fri. 1 rest day minimum between sessions.',
    nutrition: 'Eat at or slightly above maintenance. 0.8–1g protein/lb.',
  },
  hypertrophy: {
    title: '💪 Hypertrophy — Push/Pull/Legs',
    warmup: '5 min cardio + 2 feeder sets per main lift.',
    workout: '**Push:** Bench 4×8–12, OHP 3×10–12, Incline DB 3×10, Lateral raises 4×15, Triceps 3×12\n**Pull:** Weighted pull-ups 4×6–10, Cable row 3×10–12, Face pulls 3×15, Curls 3×12\n**Legs:** Squat 4×8–10, RDL 3×10–12, Leg press 3×12–15, Leg curl 3×12, Calves 4×15',
    progression: 'Track every set. Add weight or reps weekly. Deload every 6–8 weeks.',
    recovery: 'PPL×2/week (6 days). Deload: reduce volume 40%, keep intensity.',
    nutrition: 'Slight surplus (200–300 kcal). 1g protein/lb. Carbs around training.',
  },
  'fat-loss': {
    title: '🔥 Fat Loss Routine',
    warmup: '5 min brisk walk or row.',
    workout: '**Lifting 3×/week:** Squat, Deadlift, Press, Row — 3×8–10. Keep load up to preserve muscle.\n**Cardio 2–3×/week:** 30–45 min zone 2 OR 20 min HIIT\n**Daily:** 8,000–12,000 steps',
    progression: 'Maintain lifting strength. Progress cardio weekly.',
    recovery: 'Deficit 300–500 kcal/day. High protein (1g/lb).',
    nutrition: 'Prioritize protein and fiber. Cut processed food and liquid calories.',
  },
  athletic: {
    title: '⚡ Athletic Performance',
    warmup: '10 min dynamic: high knees, butt kicks, lateral shuffles, A-skips.',
    workout: '**Power 2×/week:** Box jumps 4×5, Broad jumps 3×5, Med ball slams 3×8\n**Strength 2×/week:** Front squat 4×4–6, Power clean 4×4, Single-leg RDL 3×8\n**Conditioning 2×/week:** Sprints, agility ladder, shuttle runs',
    progression: 'Focus on power output and movement quality over load.',
    recovery: 'Prioritize sleep. Contrast showers or ice baths post-session.',
    nutrition: 'Carb timing matters. Fuel before, recover after.',
  },
  bodyweight: {
    title: '🏠 Bodyweight — No Equipment',
    warmup: '3–5 min: jumping jacks, arm swings, hip circles, high knees.',
    workout: '3×max Push-ups\n3×10–15 Pike push-ups\n3×15 Squats\n3×10/side Bulgarian split squats (chair)\n3×max Inverted rows (under table)\n3×60s Plank + 3×15 Mountain climbers',
    progression: 'More reps → explosive variations → weighted vest.',
    recovery: '3–4 sessions/week.',
    nutrition: 'Standard protein targets regardless of equipment.',
  },
  mobility: {
    title: '🧘 Mobility & Recovery',
    warmup: '5 min light cardio + joint circles.',
    workout: 'Couch stretch 2×60s/side\nThread the needle 2×10/side\nPNF hamstring stretch 3×30s/side\nDoorway shoulder stretch 2×60s\nWall ankle stretch 2×60s/side\n90/90 hip stretch 2×60s/side\nWorld\'s greatest stretch 2×8/side',
    progression: 'Hold end ranges longer. Add loaded stretching. Practice daily.',
    recovery: 'Can be done daily. Best post-training or before bed.',
    nutrition: 'Hydration and collagen/Vitamin C may support connective tissue.',
  },
  ppl: {
    title: '💪 Push / Pull / Legs',
    warmup: '5 min cardio + 2 warm-up sets per lift.',
    workout: '**Push:** Bench, OHP, Incline DB, Lateral raises, Triceps\n**Pull:** Pull-ups/Lat pulldown, Rows, Face pulls, Rear delts, Biceps\n**Legs:** Squat, Romanian DL, Leg press, Leg curl, Calves',
    progression: 'PPL (3 days) or PPL×2 (6 days). Add load or reps weekly.',
    recovery: '1 full rest day/week. Deload every 8–10 weeks.',
    nutrition: 'Match intake to volume. More training = more calories needed.',
  },
  'upper-lower': {
    title: '🏋️ Upper / Lower Split',
    warmup: '5 min + specific warm-up sets.',
    workout: '**Upper A:** Bench 4×5, Row 4×5, OHP 3×8, Pull-ups 3×8\n**Lower A:** Squat 4×5, RDL 3×8, Leg press 3×10, Leg curl 3×10\n**Upper B:** Incline DB 4×10, Cable row 4×10, DB OHP 3×12\n**Lower B:** Deadlift 3×5, Front squat 3×8, Split squat 3×10',
    progression: '4-day split. Linear progression on main lifts.',
    recovery: 'Upper Mon/Thu, Lower Tue/Fri. Two rest days minimum.',
    nutrition: 'Flexible diet — hit targets, don\'t overthink timing.',
  },
};

export function handleRoutine(interaction, res) {
  const type = interaction.data.options?.find((o) => o.name === 'type')?.value ?? 'calisthenics';
  const routine = ROUTINES[type];

  if (!routine) {
    return res.json({ type: 4, data: { content: 'Unknown routine type.', flags: 64 } });
  }

  return res.json({
    type: 4,
    data: {
      embeds: [
        {
          title: routine.title,
          color: 0xe63946,
          fields: [
            { name: '🔥 Warm-Up',     value: routine.warmup,      inline: false },
            { name: '💪 Workout',     value: routine.workout,     inline: false },
            { name: '📈 Progression', value: routine.progression, inline: false },
            { name: '🛌 Recovery',    value: routine.recovery,    inline: false },
            { name: '🥗 Nutrition',   value: routine.nutrition,   inline: false },
          ],
          footer: { text: 'Bad Genetics HQ • Genie' },
        },
        { description: DISCLAIMER, color: 0x2b2d31 },
      ],
    },
  });
}
