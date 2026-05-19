export const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

export function normalizePhoneToE164(value: unknown) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (raw.startsWith("+")) {
    return `+${digits}`.slice(0, 16);
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length > 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return digits;
}

export function isValidE164Phone(value: string) {
  return E164_PHONE_PATTERN.test(value);
}

export function maskPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");

  return digits.length > 4 ? `***${digits.slice(-4)}` : "not-provided";
}
