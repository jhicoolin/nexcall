const DISCLAIMER =
  '> **Medical Disclaimer:** This routine is for informational purposes only. Consult a qualified healthcare professional before starting any new exercise program, especially if you have pre-existing health conditions.';

const ROUTINES = {
  calisthenics: {
    title: 'Calisthenics Routine',
    warmup: '5–10 min: jumping jacks, arm circles, hip rotations, leg swings, light jog.',
    workout: [
      '3×10–15 Push-ups (progress to archer / diamond)',
      '3×5–8 Pull-ups or Australian rows (progress to weighted)',
      '3×10 Dips (parallel bars or chair)',
      '3×15 Bodyweight squats (progress to pistol squat holds)',
      '3×12 Reverse lunges',
      '3×30s Plank, 3×15 Hollow body rocks',
    ],
    progression: 'Add 1–2 reps per session. When you hit the top of the range, add sets. Then add harder variations.',
    recovery: 'Rest 24–48h between sessions. 3–4 days/week optimal.',
  },
  beginner: {
    title: 'Beginner Gym Routine (3 days/week full body)',
    warmup: '5 min treadmill, dynamic stretches, 2 warm-up sets at 50% before working sets.',
    workout: [
      'Barbell Squat 3×5 (linear progression)',
      'Bench Press 3×5 (linear progression)',
      'Barbell Row 3×5',
      'Overhead Press 3×5 (alternate with bench each session)',
      'Deadlift 1×5 (once per week)',
    ],
    progression: 'Add 5 lbs / 2.5 kg every session. Deload by 10% when you stall three times.',
    recovery: 'Mon/Wed/Fri or similar. Sleep 7–9h. Eat sufficient protein (0.7–1g per lb bodyweight).',
  },
  hypertrophy: {
    title: 'Hypertrophy (Push/Pull/Legs, 6 days/week)',
    warmup: '5 min cardio, 2 feeder sets per main lift.',
    workout: [
      '**Push:** Bench 4×8–12, OHP 3×10–12, Incline DB 3×10–12, Lateral raises 4×15, Tricep pushdowns 3×12',
      '**Pull:** Weighted pull-ups 4×6–10, Cable row 3×10–12, Face pulls 3×15, Bicep curls 3×12',
      '**Legs:** Squat 4×8–10, Romanian deadlift 3×10–12, Leg press 3×12–15, Leg curl 3×12, Calf raises 4×15',
    ],
    progression: 'Progressive overload every session. Track every set. Aim to add weight or reps weekly.',
    recovery: 'PPL×2 per week. Deload week every 6–8 weeks.',
  },
  'fat-loss': {
    title: 'Fat Loss Routine',
    warmup: '5 min brisk walk or row.',
    workout: [
      '3 days resistance training (full body compound lifts — maintain muscle)',
      '2–3 days cardio: 30–45 min moderate intensity (zone 2) or 20 min HIIT',
      'Daily step goal: 8,000–12,000 steps',
      'Lift: Squat, Deadlift, Press, Row — 3×8–10 each',
    ],
    progression: 'Maintain strength on lifts. Progress cardio duration or intensity weekly.',
    recovery: 'Caloric deficit 300–500 kcal/day. Keep protein high (1g/lb) to preserve muscle.',
  },
  athletic: {
    title: 'Athletic Performance Routine',
    warmup: '10 min dynamic warm-up: high knees, butt kicks, lateral shuffles, A-skips.',
    workout: [
      '**Power (2x/week):** Box jumps 4×5, Broad jumps 3×5, Medicine ball slams 3×8',
      '**Strength (2x/week):** Front squat 4×4–6, Power clean or trap bar DL 4×4, Single-leg RDL 3×8',
      '**Conditioning (2x/week):** Sprint intervals, agility ladder, shuttle runs',
      '**Mobility (daily):** Hip flexor stretch, thoracic rotation, ankle circles',
    ],
    progression: 'Focus on speed and power output, not just weight. Film lifts to check form.',
    recovery: 'Prioritize sleep and nutrition. Ice baths or contrast showers after intense sessions.',
  },
  bodyweight: {
    title: 'Bodyweight-Only Routine (No Equipment)',
    warmup: '3–5 min: jumping jacks, arm swings, hip circles, high knees.',
    workout: [
      '3×max Push-ups',
      '3×10–15 Pike push-ups (shoulders)',
      '3×15 Bodyweight squats → progress to jump squats',
      '3×10/side Bulgarian split squats (using a chair)',
      '3×max Inverted rows (under a table)',
      '3×20s–60s Plank + 3×15 Mountain climbers',
    ],
    progression: 'Increase reps, add explosive variations (clap push-ups, jump squats), then add weighted vest.',
    recovery: '3–4 sessions/week. No equipment means no excuses.',
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
            { name: 'Warm-Up', value: routine.warmup, inline: false },
            { name: 'Workout', value: routine.workout.join('\n'), inline: false },
            { name: 'Progression', value: routine.progression, inline: false },
            { name: 'Recovery', value: routine.recovery, inline: false },
          ],
          footer: { text: 'Bad Genetics HQ • Genie' },
        },
        {
          description: DISCLAIMER,
          color: 0x2b2d31,
        },
      ],
    },
  });
}
