import type { Role, UserStatus } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      status: UserStatus;
      department?: string | null;
      jobTitle?: string | null;
      managerId?: string | null;
    };
  }
}
