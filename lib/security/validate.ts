import { NextResponse } from "next/server";
import { z, ZodError, type ZodType } from "zod";

/**
 * Validate a JSON request body against a Zod schema.
 *
 * Usage:
 *   const parsed = await parseBody(req, mySchema);
 *   if (!parsed.ok) return parsed.error;
 *   const { name, email } = parsed.data;
 *
 * On failure, returns a 400 with a structured `{ error, fields: { ... } }`
 * payload so the client can surface per-field errors without exposing
 * internal schema details.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Validation failed", fields: flattenZodError(result.error) },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}

function flattenZodError(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_root";
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}

// ─── Shared field schemas ────────────────────────────────────────────────────

/** Trimmed, lowercased, RFC-loose email. Max 254 chars (RFC 5321). */
export const emailField = z.string().trim().min(3).max(254).email().toLowerCase();

/** Display name: 1-100 chars, trimmed, no control characters. */
export const nameField  = z.string().trim().min(1).max(100).regex(/^[^\x00-\x1F\x7F]+$/, "Invalid characters");

/** Free-form note / message body: up to 2000 chars, control chars stripped. */
export const noteField  = z.string().trim().max(2000);

/** Employee ID: MBD-XX-NNNN format. */
export const employeeIdField = z.string().trim().regex(/^MBD-[A-Z]{2}-\d{4}$/, "Invalid Employee ID format");

/** Access code: 6-12 alphanumeric chars (handles legacy 6-digit + new 10-char codes). */
export const accessCodeField = z.string().trim().min(4).max(16).regex(/^[A-Za-z0-9]+$/, "Access code must be alphanumeric");

/** CUID-style id (Prisma default). */
export const cuidField = z.string().trim().regex(/^c[a-z0-9]{20,30}$/, "Invalid id");
