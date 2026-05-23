import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — runs on every request before route handlers.
 *
 * Responsibilities:
 *   1. Apply security response headers (CSP, HSTS, X-Frame-Options, etc.)
 *   2. Block obviously-bad requests (oversized headers, suspicious paths)
 *
 * NOTE: Authentication is enforced inside route handlers and in `(app)/layout.tsx`
 * — middleware cannot reliably read NextAuth's database session cookie at the
 * edge runtime, and re-checking it here would just duplicate the work. The
 * middleware's job is the network-layer hygiene that has to happen for every
 * response.
 */

// ─── Security headers ────────────────────────────────────────────────────────

/**
 * Content-Security-Policy.
 *
 * - default-src 'self'  → only load resources from our own origin
 * - script-src includes 'unsafe-inline' + 'unsafe-eval' because Next.js / React
 *   inject hydration scripts and dev-mode HMR uses eval. In a future hardening
 *   we should move to nonce-based CSP, but that requires a per-request script
 *   nonce strategy.
 * - img-src allows the avatar/CDN hosts already in next.config.ts
 * - frame-ancestors 'none' → clickjacking protection (stricter than X-Frame-Options DENY)
 * - upgrade-insecure-requests → forces any http:// resource refs to https://
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://res.cloudinary.com https://avatars.githubusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://accounts.google.com https://*.vercel.app https://api.cloudinary.com",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":        CSP,
  "Strict-Transport-Security":      "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options":                "DENY",                  // redundant w/ frame-ancestors but defends old browsers
  "X-Content-Type-Options":         "nosniff",
  "Referrer-Policy":                "strict-origin-when-cross-origin",
  "Permissions-Policy":             "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()",
  "X-DNS-Prefetch-Control":         "on",
  "Cross-Origin-Opener-Policy":     "same-origin",
  "Cross-Origin-Resource-Policy":   "same-origin",
};

export function middleware(req: NextRequest) {
  // Cheap path-based filter: block obvious scanner/probe paths early.
  const pathname = req.nextUrl.pathname;
  if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const res = NextResponse.next();

  // Attach security headers to every response.
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(name, value);
  }

  // Tighten cache headers for authenticated app routes (don't let CDN cache
  // anything that depends on the user's session).
  if (pathname.startsWith("/api/") || isAppRoute(pathname)) {
    res.headers.set("Cache-Control", "no-store, max-age=0");
  }

  return res;
}

// Routes that render authenticated UI and must never be cached at the CDN edge.
function isAppRoute(p: string): boolean {
  return (
    p.startsWith("/dashboard") ||
    p.startsWith("/admin")     ||
    p.startsWith("/account")   ||
    p.startsWith("/settings")  ||
    p.startsWith("/first-login") ||
    p.startsWith("/pending")
  );
}

// Common scanner paths — return 404 fast so we don't waste a route handler invocation.
const BLOCKED_PATHS = [
  "/wp-admin",
  "/wp-login",
  "/.env",
  "/.git",
  "/phpmyadmin",
  "/xmlrpc.php",
];

// Exclude static assets — they don't need security headers (and adding them
// blows up the CSS/font cache hit rate).
export const config = {
  matcher: [
    /*
     * Match everything EXCEPT:
     *   - _next/static (Next bundles)
     *   - _next/image  (image optimisation)
     *   - favicon.ico
     *   - public assets (.png, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf|otf)$).*)",
  ],
};
