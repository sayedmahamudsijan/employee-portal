import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { generateEmployeeId } from "@/lib/employee-id";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return "/api/auth/signin?error=NoEmail";

      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;

      // Check if email is on the manual whitelist
      const whitelisted = await prisma.allowedEmail.findUnique({
        where: { email: user.email },
      });

      if (whitelisted) {
        // Auto-activate whitelisted emails on first sign-in
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (existingUser && existingUser.status === "PENDING") {
          const employeeId = await generateEmployeeId();
          await prisma.user.update({
            where: { email: user.email },
            data: { status: "ACTIVE", employeeId },
          });
        }
        return true;
      }

      // Check domain restriction
      if (allowedDomain && allowedDomain !== "any") {
        if (!user.email.endsWith(`@${allowedDomain}`)) {
          return "/api/auth/signin?error=EmailNotAllowed";
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            status: true,
            department: true,
            jobTitle: true,
            managerId: true,
            employeeId: true,
            customRoleId: true,
          },
        });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.status = dbUser.status;
          session.user.department = dbUser.department;
          session.user.jobTitle = dbUser.jobTitle;
          session.user.managerId = dbUser.managerId;
          session.user.employeeId = dbUser.employeeId;
          session.user.customRoleId = dbUser.customRoleId;
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
