import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey() {
  const raw = process.env.SECRET_ENCRYPTION_KEY || "";

  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("SECRET_ENCRYPTION_KEY is required in production.");
  }

  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  try {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) return decoded;
  } catch {
    // Fall through to development-only derived key.
  }

  return createHash("sha256").update(raw || "development-only-secret-key").digest();
}

export function encryptSecret(value: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64")
  };
}

export function decryptSecret(secret?: Partial<EncryptedSecret> | null) {
  if (!secret?.ciphertext || !secret.iv || !secret.authTag) return "";

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(secret.iv, "base64"));
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function hashSecret(value: string) {
  const key = getEncryptionKey();

  return createHmac("sha256", key).update(value).digest("hex");
}

