import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "MEMBER";
      image?: string | null;
    };
  }

  interface User {
    role: "ADMIN" | "MEMBER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MEMBER";
  }
}
