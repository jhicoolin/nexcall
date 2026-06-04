export function isConfiguredValue(value?: string | null) {
  return Boolean(value && value.trim() && !value.includes("replace_me"));
}

export function isStripeCheckoutEnabledFlag(value?: string | null) {
  return String(value || "").trim().toLowerCase() === "true";
}

export function isStripeCheckoutEnabledInEnv() {
  return isStripeCheckoutEnabledFlag(process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED);
}
