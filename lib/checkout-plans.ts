export type CheckoutBilling = "monthly" | "yearly";
export type CheckoutPlanId = "starter" | "appointment" | "growth";

type CheckoutPlan = {
  id: CheckoutPlanId;
  name: string;
  monthlyEnv: string;
  yearlyEnv: string;
};

export const checkoutPlans: CheckoutPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyEnv: "STRIPE_STARTER_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_STARTER_YEARLY_PRICE_ID"
  },
  {
    id: "appointment",
    name: "Appointment",
    monthlyEnv: "STRIPE_APPOINTMENT_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_APPOINTMENT_YEARLY_PRICE_ID"
  },
  {
    id: "growth",
    name: "Growth",
    monthlyEnv: "STRIPE_GROWTH_MONTHLY_PRICE_ID",
    yearlyEnv: "STRIPE_GROWTH_YEARLY_PRICE_ID"
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

  const envName = getPriceEnvName(planId, billing);

  if (!envName) return null;

  const priceId = process.env[envName];

  if (!priceId || priceId.includes("replace_me")) {
    return null;
  }

  return priceId;
}

export function getPriceEnvName(planId: string, billing: CheckoutBilling) {
  const plan = getCheckoutPlan(planId);

  if (!plan) {
    return null;
  }

  return billing === "yearly" ? plan.yearlyEnv : plan.monthlyEnv;
}
