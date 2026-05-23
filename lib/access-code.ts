import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

/**
 * One-time portal access codes.
 *
 * Generation:
 *   - 10-character alphanumeric, ~52 bits of entropy (~4.5 × 10^15 combinations).
 *   - Excludes look-alike characters (0/O, 1/I/l) so users don't mis-type.
 *
 * Storage:
 *   - bcrypt (cost 12) — slow, salted, resistant to GPU brute-force.
 *   - Legacy SHA-256 (hex, 64 chars) is still accepted for old records so we
 *     don't invalidate existing PENDING invitations. New codes always use bcrypt.
 *
 * Verification:
 *   - Constant-time comparison (bcrypt.compare or timingSafeEqual for SHA-256).
 *   - Combined with a per-user attempt counter + lockout in the verify-code API.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars — no 0/O/1/I/L
const CODE_LENGTH = 10;
const BCRYPT_COST = 12;

/** Generate a fresh access code: 10 unambiguous alphanumeric chars. */
export function generateAccessCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Hash a plain access code for storage (bcrypt cost 12, salted). */
export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_COST);
}

/** Synchronous SHA-256 hash — kept only for legacy reads / migration helpers. */
function legacySha256(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Constant-time verify against either a bcrypt hash (new) or a legacy SHA-256
 * hex hash (old records). Returns false on any error rather than throwing.
 */
export async function verifyAccessCode(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  const trimmed = plain.trim();
  try {
    // bcrypt hashes always start with "$2a$", "$2b$", or "$2y$"
    if (hash.startsWith("$2")) {
      return await bcrypt.compare(trimmed, hash);
    }
    // Legacy path: 64-char hex SHA-256. Use timingSafeEqual to avoid side channels.
    if (hash.length === 64 && /^[0-9a-f]+$/i.test(hash)) {
      const computed = legacySha256(trimmed);
      const a = Buffer.from(computed, "hex");
      const b = Buffer.from(hash, "hex");
      return a.length === b.length && timingSafeEqual(a, b);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Whether a stored hash is in the legacy SHA-256 format and should be
 * re-hashed with bcrypt on next successful verification.
 */
export function isLegacyHash(hash: string | null | undefined): boolean {
  return !!hash && hash.length === 64 && /^[0-9a-f]+$/i.test(hash);
}

/** Default access-code lifetime: 7 days from issuance. */
export const DEFAULT_ACCESS_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Compute the expiry timestamp for a newly-issued access code. */
export function defaultAccessCodeExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + DEFAULT_ACCESS_CODE_TTL_MS);
}
