import { checkRateLimit } from '../rateLimit.js';
import { EPHEMERAL } from '../permissions.js';

const DISCLAIMER = '> General guidance only — not medical or dietary advice.';

const RECIPES = {
  'high-protein': [
    {
      name: 'Chicken & Rice Power Bowl',
      macros: '~550 kcal • 55g protein • 45g carbs • 12g fat',
      prep: '20 min',
      cost: 'Budget-friendly',
      ingredients: '200g chicken breast, 150g white rice, broccoli, 1 tbsp olive oil, soy sauce, garlic',
      instructions: '1. Season and pan-sear chicken (6-7 min/side).\n2. Cook rice.\n3. Steam broccoli.\n4. Combine and drizzle with soy + garlic.',
      tags: ['bulk', 'cut', 'meal-prep'],
    },
    {
      name: 'Greek Yogurt Protein Bowl',
      macros: '~380 kcal • 35g protein • 40g carbs • 6g fat',
      prep: '5 min',
      cost: 'Budget-friendly',
      ingredients: '300g Greek yogurt (0%), 30g protein powder, banana, blueberries, 1 tbsp honey',
      instructions: '1. Mix yogurt + protein powder.\n2. Top with fruit and honey.\n3. Done.',
      tags: ['quick', 'breakfast'],
    },
  ],
  bulk: [
    {
      name: 'Mass Builder Burger Meal',
      macros: '~900 kcal • 60g protein • 80g carbs • 35g fat',
      prep: '25 min',
      cost: 'Mid',
      ingredients: '250g ground beef (80/20), 2 brioche buns, 2 eggs, cheese, avocado, sweet potato fries',
      instructions: '1. Form and grill patties (4-5 min/side).\n2. Fry eggs.\n3. Air-fry sweet potato.\n4. Stack and build.',
      tags: ['bulk', 'high-calorie'],
    },
    {
      name: 'Overnight Oats Bulk',
      macros: '~620 kcal • 30g protein • 80g carbs • 15g fat',
      prep: '5 min + overnight',
      cost: 'Budget-friendly',
      ingredients: '100g rolled oats, 300ml whole milk, 30g protein powder, 2 tbsp peanut butter, banana, honey',
      instructions: '1. Mix everything in a jar.\n2. Refrigerate overnight.\n3. Add banana in the morning.',
      tags: ['bulk', 'breakfast', 'meal-prep'],
    },
  ],
  cut: [
    {
      name: 'Tuna Lettuce Wraps',
      macros: '~280 kcal • 40g protein • 8g carbs • 9g fat',
      prep: '10 min',
      cost: 'Budget-friendly',
      ingredients: '2 cans tuna, romaine lettuce, cherry tomatoes, cucumber, lemon, Dijon mustard',
      instructions: '1. Mix tuna with Dijon + lemon.\n2. Spoon into lettuce cups.\n3. Add tomatoes and cucumber.',
      tags: ['cut', 'low-carb', 'quick'],
    },
    {
      name: 'Egg White Scramble',
      macros: '~240 kcal • 35g protein • 10g carbs • 5g fat',
      prep: '10 min',
      cost: 'Budget-friendly',
      ingredients: '6 egg whites, 1 whole egg, spinach, mushrooms, cherry tomatoes, salt, pepper',
      instructions: '1. Sauté veggies 3 min.\n2. Add eggs and scramble on medium-low.\n3. Season.',
      tags: ['cut', 'breakfast', 'low-calorie'],
    },
  ],
  'meal-prep': [
    {
      name: 'Batch Chicken Breast',
      macros: 'Per 200g: ~330 kcal • 62g protein • 0g carbs • 7g fat',
      prep: '35 min (makes 5 servings)',
      cost: 'Budget-friendly',
      ingredients: '1kg chicken breast, olive oil, garlic powder, paprika, salt, pepper, lemon',
      instructions: '1. Preheat oven to 200°C.\n2. Season all breasts.\n3. Bake 25-30 min.\n4. Rest 5 min, slice, and store in meal-prep containers.',
      tags: ['meal-prep', 'bulk', 'cut'],
    },
  ],
  budget: [
    {
      name: 'Egg Fried Rice',
      macros: '~500 kcal • 22g protein • 65g carbs • 14g fat',
      prep: '15 min',
      cost: '$2-3 per serving',
      ingredients: '200g cooked rice (day-old works best), 3 eggs, soy sauce, sesame oil, green onion, frozen peas',
      instructions: '1. Heat oil in wok on high.\n2. Scramble eggs, push aside.\n3. Add rice and fry 3 min.\n4. Mix in soy + sesame + peas.\n5. Top with green onion.',
      tags: ['budget', 'bulk'],
    },
  ],
  random: null,
};

function getRandomRecipe() {
  const all = Object.values(RECIPES).flat().filter(Boolean);
  return all[Math.floor(Math.random() * all.length)];
}

function buildRecipeEmbed(recipe) {
  return {
    type: 4,
    data: {
      embeds: [{
        title: `🥗  ${recipe.name}`,
        color: 0xe63946,
        fields: [
          { name: '📊 Macros',       value: recipe.macros,       inline: false },
          { name: '⏱️ Prep Time',    value: recipe.prep,         inline: true },
          { name: '💰 Cost',         value: recipe.cost,         inline: true },
          { name: '🛒 Ingredients',  value: recipe.ingredients,  inline: false },
          { name: '👨‍🍳 Instructions', value: recipe.instructions, inline: false },
        ],
        footer: { text: 'Bad Genetics HQ • Nutrition' },
      }, {
        description: DISCLAIMER,
        color: 0x2b2d31,
      }],
    },
  };
}

export function handleRecipe(interaction, res) {
  const sub = interaction.data.options?.[0]?.name ?? 'random';
  const userId = interaction.member?.user?.id ?? 'anon';

  const limit = checkRateLimit(`recipe:${userId}`, 5, 60_000);
  if (!limit.allowed) {
    return res.json({ type: 4, data: { content: `Slow down. Try again in ${limit.retryAfter}s.`, flags: EPHEMERAL } });
  }

  let pool;
  if (sub === 'random') {
    return res.json(buildRecipeEmbed(getRandomRecipe()));
  } else {
    pool = RECIPES[sub];
  }

  if (!pool || pool.length === 0) {
    return res.json({ type: 4, data: { content: 'No recipes found for that category.', flags: EPHEMERAL } });
  }

  const recipe = pool[Math.floor(Math.random() * pool.length)];
  return res.json(buildRecipeEmbed(recipe));
}
