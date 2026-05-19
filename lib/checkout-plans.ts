export type CheckoutBilling = "monthly" | "yearly";
export type CheckoutPlanId = "starter" | "appointment" | "growth";

type CheckoutPlan = {
  id: CheckoutPlanId;
  name: string;
  monthlyAmount: number;
  monthlyEnv: string;
  yearlyEnv: string;
  aliasEnv: string;
};

export const checkoutPlans: CheckoutPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyAmount: 149,
    monthlyEnv: "STRIPE_STARTER_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_STARTER_YEARLY_PRICE_ID",
    aliasEnv: "STRIPE_STARTER_PRICE_ID"
  },
  {
    id: "appointment",
    name: "Appointment",
    monthlyAmount: 199,
    monthlyEnv: "STRIPE_APPOINTMENT_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_APPOINTMENT_YEARLY_PRICE_ID",
    aliasEnv: "STRIPE_APPOINTMENT_PRICE_ID"
  },
  {
    id: "growth",
    name: "Growth",
    monthlyAmount: 349,
    monthlyEnv: "STRIPE_GROWTH_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_GROWTH_YEARLY_PRICE_ID",
    aliasEnv: "STRIPE_GROWTH_PRICE_ID"
  }
];

export function getCheckoutPlan(planId: string) {
  return checkoutPlans.find((plan) => plan.id === planId);
}

export function getPriceId(planId: string, billing: CheckoutBilling) {
  const plan = getCheckoutPlan(planId);

  if (!plan) {
    return null;
  }

  for (const envName of getPriceEnvNames(planId, billing)) {
    const priceId = process.env[envName];

    if (priceId && !priceId.includes("replace_me")) {
      return priceId;
    }
  }

  return null;
}

export function getPriceEnvName(planId: string, billing: CheckoutBilling) {
  return getPriceEnvNames(planId, billing)[0] || null;
}

export function getPriceEnvNames(planId: string, billing: CheckoutBilling) {
  const plan = getCheckoutPlan(planId);

  if (!plan) {
    return [];
  }

  const billingEnv = billing === "yearly" ? plan.yearlyEnv : plan.monthlyEnv;

  return [billingEnv, plan.aliasEnv];
}

export function getInlinePriceData(planId: string, billing: CheckoutBilling) {
  const plan = getCheckoutPlan(planId);

  if (!plan) return null;

  const monthlyDiscounted = billing === "yearly" ? Math.round(plan.monthlyAmount * 0.85) : plan.monthlyAmount;
  const unitAmount = billing === "yearly" ? monthlyDiscounted * 12 * 100 : plan.monthlyAmount * 100;

  return {
    productName: `NexCall ${plan.name}`,
    unitAmount,
    interval: billing === "yearly" ? "year" : "month"
  };
}
