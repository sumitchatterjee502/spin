export {};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    admin?: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      email: string;
      roles: { id: number; name: string }[];
    };
    roles?: { id: number; name: string }[];
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    admin?: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      email: string;
      roles: { id: number; name: string }[];
    };
    roles?: { id: number; name: string }[];
    permissions?: string[];
  }
}
