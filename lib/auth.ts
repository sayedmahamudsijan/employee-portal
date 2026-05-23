import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/security/audit";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow Google OAuth to link to a pre-created PENDING user record
      // (created by the invitation flow before the user has ever signed in).
      // Without this flag NextAuth throws OAuthAccountNotLinked for invited users.
      // This is safe because the AllowedEmail whitelist in signIn() below
      // restricts which emails can ever reach this code path.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        await audit({ event: "SIGN_IN_BLOCKED", metadata: { reason: "no_email" } });
        return "/api/auth/signin?error=NoEmail";
      }

      const email = user.email.toLowerCase();

      // ── Invitation-only gate ──────────────────────────────────────────────
      // Only emails on the AllowedEmail whitelist can sign in.
      const whitelisted = await prisma.allowedEmail.findUnique({ where: { email } });
      if (!whitelisted) {
        await audit({
          event: "SIGN_IN_BLOCKED",
          email,
          metadata: { reason: "email_not_whitelisted" },
        });
        return "/api/auth/signin?error=EmailNotAllowed";
      }

      // ── Hard blocks: deactivated or session-revoked accounts ──────────────
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, status: true, accessCodeUsed: true, sessionsValidFrom: true },
      });

      if (existingUser?.status === "INACTIVE") {
        await audit({
          event: "SIGN_IN_BLOCKED",
          email,
          userId: existingUser.id,
          severity: "warn",
          metadata: { reason: "user_inactive" },
        });
        return "/api/auth/signin?error=AccountDisabled";
      }

      // Old-style approval (no invite code) — activate immediately.
      if (existingUser && existingUser.status === "PENDING" && existingUser.accessCodeUsed) {
        await prisma.user.update({
          where: { email },
          data:  { status: "ACTIVE" },
        });
      }

      return true;
    },

    async session({ session, user }) {
      if (!session.user) return session;
      session.user.id = user.id;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          role:              true,
          status:            true,
          department:        true,
          jobTitle:          true,
          managerId:         true,
          employeeId:        true,
          customRoleId:      true,
          accessCodeUsed:    true,
          sessionsValidFrom: true,
        },
      });

      if (dbUser) {
        session.user.role           = dbUser.role;
        session.user.status         = dbUser.status;
        session.user.department     = dbUser.department;
        session.user.jobTitle       = dbUser.jobTitle;
        session.user.managerId      = dbUser.managerId;
        session.user.employeeId     = dbUser.employeeId;
        session.user.customRoleId   = dbUser.customRoleId;
        session.user.accessCodeUsed = dbUser.accessCodeUsed;

        // ── Server-side session revocation ───────────────────────────────
        // If the user's `sessionsValidFrom` is later than this session's
        // `expires - 30d` (the session was created before the revocation),
        // delete every Session row for this user. NextAuth will see no
        // matching session token on the next request and force re-login.
        if (dbUser.sessionsValidFrom) {
          const tokens = await prisma.session.findMany({
            where: { userId: user.id },
            select: { id: true, expires: true },
          });
          // Sessions have a fixed 30-day TTL by NextAuth default — anything
          // expiring before (sessionsValidFrom + 30d) was issued before the
          // revocation cutoff.
          const cutoff = new Date(dbUser.sessionsValidFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
          const stale = tokens.filter((t) => t.expires < cutoff);
          if (stale.length > 0) {
            await prisma.session.deleteMany({ where: { id: { in: stale.map((t) => t.id) } } });
          }
        }
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id!,
          casual: 12,
          sick: 10,
          annual: 15,
          year: new Date().getFullYear(),
        },
      }).catch(() => {});
      await audit({ event: "USER_CREATED", userId: user.id, email: user.email });
    },

    async signIn({ user, isNewUser }) {
      // Record successful sign-in + last-login fields.
      try {
        await prisma.user.update({
          where: { id: user.id! },
          data:  { lastLoginAt: new Date() },
        });
      } catch { /* non-fatal */ }
      await audit({
        event:    "SIGN_IN_SUCCESS",
        userId:   user.id,
        email:    user.email,
        metadata: { isNewUser: !!isNewUser },
      });
    },

    async signOut({ session }) {
      const userId = (session as any)?.user?.id ?? null;
      const email  = (session as any)?.user?.email ?? null;
      await audit({ event: "SIGN_OUT", userId, email });
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "database",
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },
};

export default NextAuth(authOptions);

// Re-export Role to keep existing imports working.
export type { Role };
