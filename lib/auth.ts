import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
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
    async signIn({ user }) {
      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
      if (allowedDomain && allowedDomain !== "any" && user.email) {
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
          select: { role: true, status: true, department: true, jobTitle: true, managerId: true },
        });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.status = dbUser.status;
          session.user.department = dbUser.department;
          session.user.jobTitle = dbUser.jobTitle;
          session.user.managerId = dbUser.managerId;
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
