import { createHash, randomBytes } from "crypto";

/** Generate a random 8-character alphanumeric access code, e.g. "X7K2M9QR" */
export function generateAccessCode(): string {
  return randomBytes(6)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 8)
    .padEnd(8, "A");
}

/** Hash a plain access code for storage (SHA-256, hex) */
export function hashAccessCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Verify a plain code against a stored hash */
export function verifyAccessCode(plain: string, hash: string): boolean {
  return hashAccessCode(plain) === hash;
}
