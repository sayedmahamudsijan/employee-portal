import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
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
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/api/auth/signin?error=NoEmail";

      // ── Invitation-only gate ──────────────────────────────────────────────
      // Only emails on the AllowedEmail whitelist can sign in.
      // The whitelist is populated automatically when an invitation is sent.
      const whitelisted = await prisma.allowedEmail.findUnique({
        where: { email: user.email },
      });

      if (!whitelisted) {
        return "/api/auth/signin?error=EmailNotAllowed";
      }

      // Whitelisted: ensure the user record exists and has PENDING status at
      // minimum (the first-login flow will activate it after code verification)
      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (existingUser && existingUser.status === "PENDING" && existingUser.accessCodeUsed) {
        // Old-style approval (no invite code) — activate immediately
        await prisma.user.update({
          where: { email: user.email },
          data:  { status: "ACTIVE" },
        });
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role:           true,
            status:         true,
            department:     true,
            jobTitle:       true,
            managerId:      true,
            employeeId:     true,
            customRoleId:   true,
            accessCodeUsed: true,
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
      });
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "database",
  },
};

export default NextAuth(authOptions);
