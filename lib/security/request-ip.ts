/**
 * Extract a stable client identifier from a Request / NextRequest.
 *
 * Trusts `x-forwarded-for` (set by Vercel's edge network), falls back to
 * `x-real-ip`, then to a fixed "unknown" string. The first IP in the XFF
 * chain is the originating client.
 *
 * NEVER use the result of this function to make trust decisions — IPs can
 * be spoofed by clients that bypass our edge. It's good enough for rate
 * limiting and audit logs.
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function getUserAgent(req: Request | { headers: Headers }): string | null {
  return req.headers.get("user-agent");
}
