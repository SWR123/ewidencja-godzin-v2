import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      requirePasswordReset: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    requirePasswordReset: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    requirePasswordReset: boolean;
  }
}
