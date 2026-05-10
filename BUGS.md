# Bug Log — MBD Portal

A running record of every bug encountered during development, how it was diagnosed, and how it was fixed. The goal is to save time if these regressions reappear.

---

## BUG-001 — `@/components/ui/avatar` does not exist

**Encountered during:** History feed initial build  
**Symptom:** Build error — `Module not found: Can't resolve '@/components/ui/avatar'`  
**Root cause:** The project uses a custom shared avatar at `@/components/shared/avatar`, not the shadcn compound component pattern. `@/components/ui/avatar` was never created in this project.  
**Fix:** Changed import and usage:
```diff
- import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
+ import { Avatar } from "@/components/shared/avatar"

- <Avatar>
-   <AvatarImage src={src} />
-   <AvatarFallback>{initials}</AvatarFallback>
- </Avatar>
+ <Avatar name={name} src={src} size="sm" />
```
**Prevention:** Always check `components/shared/` before reaching for `components/ui/` for common atoms in this project.

---

## BUG-002 — TypeScript: `preUpdateSnapshot` resolves to type `never`

**Encountered during:** `app/api/users/[id]/route.ts` — activity logging before user update  
**Symptom:** TypeScript error: `Type 'X' is not assignable to type 'never'`  
**Root cause:** The variable was typed with `as typeof preUpdateSnapshot` while it was still `null` (its initial value). TypeScript inferred the type of the variable as `null` at that point, so `typeof preUpdateSnapshot === null`, and the cast became `as null` — making every subsequent assignment invalid.  
**Fix:** Declare an explicit named type first, then use it:
```ts
type UserSnapshot = { name: string; role: string; status: string };
let preUpdateSnapshot: UserSnapshot | null = null;
// ...
if (snap) preUpdateSnapshot = { name: snap.name, role: snap.role as string, status: snap.status as string };
```
**Prevention:** Never use `as typeof <variable>` on a variable whose type is still `null`/`undefined`. Always define an explicit named type.

---

## BUG-003 — TypeScript: `oldValue`/`newValue` type mismatch on Prisma Json fields

**Encountered during:** `lib/activity-logger.ts`  
**Symptom:** TypeScript error: `Type 'Record<string, unknown>' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue'`  
**Root cause:** Prisma's generated type for Json fields is `InputJsonValue`, which is a strict union. `Record<string, unknown>` is too broad and doesn't satisfy it.  
**Fix:** Add the `Prisma` namespace import and cast:
```ts
import type { Prisma } from "@prisma/client";

oldValue: (entry.oldValue ?? undefined) as Prisma.InputJsonValue | undefined,
newValue: (entry.newValue ?? undefined) as Prisma.InputJsonValue | undefined,
```
**Prevention:** Always cast Json field values to `Prisma.InputJsonValue` when writing to Prisma. The `?? undefined` handles the `null → undefined` conversion (Prisma won't accept `null` for optional Json fields unless the schema marks them nullable).

---

## BUG-004 — `EXECUTIVE_ROLES` imported from wrong module

**Encountered during:** `app/api/history/route.ts` and `app/api/history/cleanup/route.ts`  
**Symptom:** TypeScript error — `EXECUTIVE_ROLES` is not exported from `@/lib/server-auth`  
**Root cause:** `EXECUTIVE_ROLES` is defined in `lib/roles.ts`, not `lib/server-auth.ts`. The wrong module was referenced.  
**Fix:**
```diff
- import { EXECUTIVE_ROLES } from "@/lib/server-auth"
+ import { EXECUTIVE_ROLES } from "@/lib/roles"
```
**Prevention:** `lib/roles.ts` owns role constants. `lib/server-auth.ts` owns auth helpers (`requireAuth`, `withRole`, etc.). Don't confuse them.

---

## BUG-005 — History page 404 on first Vercel deployment

**Encountered during:** First push of the History feature  
**Symptom:** `/history` returned 404 on Vercel even though the files were committed  
**Root cause:** The first commit (`1991f80`) had TypeScript errors (BUG-001 through BUG-004 above). Vercel's build failed silently and kept serving the previous deployment — which had no `/history` route. The UI gave no clear indication of the build failure; it just served stale content.  
**Fix:** Fixed all TypeScript errors, pushed again (`4370ae4`). Build succeeded and `/history` became accessible.  
**Prevention:** Always check the Vercel deployment dashboard after a push. A successful push to GitHub does NOT mean a successful Vercel build. Check the build logs tab if pages are unexpectedly missing.

---

## BUG-006 — `oldValue` in role-change log was always `undefined`

**Encountered during:** Activity logging in `app/api/users/[id]/route.ts`  
**Symptom:** History diff view showed no "Before" value for role changes  
**Root cause:** The original code constructed `oldValue` from the request body:
```ts
oldValue: { role: body.role === data.role ? undefined : "previous" }
```
Since `data.role` IS `body.role` (the new value was copied from the body into `data`), the condition was always `true`, always producing `undefined`.  
**Fix:** Fetch a pre-update snapshot from the database before calling `prisma.user.update()`:
```ts
const snap = await prisma.user.findUnique({ where: { id }, select: { name, role, status } });
// ... then after update:
oldValue: { role: preUpdateSnapshot.role },
newValue: { role: data.role },
```
**Prevention:** Always snapshot the current DB state _before_ the update when logging diffs. Never derive "old" values from the request body — the body carries the new desired values, not the old ones.

---

## BUG-007 — Stale Prisma client types after `prisma db push`

**Encountered during:** Local TypeScript checking after adding `section`, `oldValue`, `newValue` fields to `ActivityLog`  
**Symptom:** TypeScript reported `section` as not existing on `ActivityLogCreateInput`, even though `prisma db push` completed successfully  
**Root cause:** `prisma db push` applies the schema to the database but does NOT regenerate the TypeScript client types. The local `node_modules/.prisma/client` was still pointing to the old generated types.  
**Fix:**
```bash
npx prisma generate
```
**Prevention:** After any schema change, always run `prisma generate` locally. The Vercel build script (`prisma generate && next build`) handles this automatically in CI, which is why Vercel builds can succeed while local `tsc` fails.

---

## BUG-008 — `createNotification` removed from `lib/notifications` but still imported

**Encountered during:** `app/api/expenses/[id]/route.ts` migration  
**Symptom:** Build error — `createNotification is not exported from '@/lib/notifications'`  
**Root cause:** The `lib/notifications` module was refactored and `createNotification` was removed. Routes that weren't migrated kept the old import.  
**Fix:** Replace with direct Prisma call:
```ts
await prisma.notification.create({
  data: { userId, type: "...", title: "...", message: "...", link: "..." },
});
```
**Prevention:** When removing a utility export, grep the entire codebase for its usages first: `grep -r "createNotification" --include="*.ts"`.

---

## BUG-009 — Feature access mid-session redirect confusion

**Encountered during:** Testing history access control  
**Symptom:** After granting history access to a role via API and then revoking it, navigating to `/history/*` redirected to `/dashboard` even though the user was still in an active session  
**Root cause:** This is expected behavior, not a bug. The server-side page component re-checks `featureAccess` on every page load (not cached at session level). When access is revoked in the DB, the next navigation sees the updated value.  
**Resolution:** Not a bug — the design is intentional. Access changes take effect immediately on the next navigation. Document this in case it's misread as a session bug in the future.

---

## BUG-010 — `(app)` route group parentheses break bash `git add`

**Encountered during:** Committing files under `app/(app)/history/`  
**Symptom:** Bash shell errors: `syntax error near unexpected token '('` when using `git add app/(app)/...`  
**Root cause:** Bash treats `(` and `)` as subshell delimiters. The path `app/(app)/...` causes a parse error.  
**Fix:** Use PowerShell instead of bash for git operations on this project, or wrap paths in quotes with bash:
```powershell
# PowerShell (works):
git add "app/(app)/history/workspace/page.tsx"
```
```bash
# Bash (works with quoting):
git add 'app/(app)/history/workspace/page.tsx'
```
**Prevention:** This project's route group `(app)` will always trip up unquoted bash paths. Always quote paths containing parentheses or use PowerShell.

---

---

## BUG-011 — `prisma db push` connects to wrong database (localhost) instead of Neon

**Encountered during:** Pushing `designConfig Json?` column addition to `CompanySettings`  
**Symptom:** `prisma db push` fails with `Connection refused` to `localhost:51214`, ignoring the Neon URL  
**Root cause:** The project has two env files:
- `.env` — loaded by `dotenv/config` in `prisma.config.ts`; contains a **local** Prisma Postgres URL (the Prisma-managed local DB)
- `.env.local` — loaded by Next.js at runtime; contains the **real Neon** production URL

When running CLI commands (`prisma db push`, `prisma generate`, etc.), Node.js loads `.env` via `prisma.config.ts`, NOT `.env.local`. So the CLI always tries to connect to localhost.  
**Fix:** Explicitly override `DATABASE_URL` in the shell before running Prisma commands:
```powershell
$env:DATABASE_URL = "postgresql://neondb_owner:npg_LJCWlT7eFj4p@ep-floral-sea-an1ujdjo-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma db push
```
**Prevention:** Always set `$env:DATABASE_URL` explicitly in PowerShell before any Prisma CLI command on this project. The Neon URL is in `.env.local` but is invisible to the Prisma CLI. Vercel's build environment has the correct `DATABASE_URL` set via Vercel env vars, so CI is unaffected.

---

## Summary Table

| ID | Area | Symptom | Fix |
|----|------|---------|-----|
| BUG-001 | Build | Module not found: `@/components/ui/avatar` | Use `@/components/shared/avatar` |
| BUG-002 | TypeScript | `preUpdateSnapshot` resolves to `never` | Explicit named type before `let` declaration |
| BUG-003 | TypeScript | Prisma Json field type mismatch | Cast to `Prisma.InputJsonValue` |
| BUG-004 | TypeScript | `EXECUTIVE_ROLES` not found in `server-auth` | Import from `@/lib/roles` instead |
| BUG-005 | Deployment | History 404 after push | Fix TS errors; Vercel keeps old build on failure |
| BUG-006 | Logic | `oldValue` always `undefined` in logs | Snapshot DB state before update |
| BUG-007 | TypeScript | Prisma field missing after `db push` | Run `npx prisma generate` after schema changes |
| BUG-008 | Build | `createNotification` not exported | Replace with direct `prisma.notification.create` |
| BUG-009 | UX | Redirect after access revoke | Expected behavior — access re-checked per navigation |
| BUG-010 | Shell | Bash can't `git add` paths with `(app)` | Quote paths or use PowerShell |
| BUG-011 | Deployment | `prisma db push` hits localhost, not Neon | Set `$env:DATABASE_URL` explicitly in PowerShell |
