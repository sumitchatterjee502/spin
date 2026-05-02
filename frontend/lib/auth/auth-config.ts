import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { extractResponseData } from "@/lib/api/standardResponse";

export interface AdminRole {
  id: number;
  name: string;
}

export interface AdminPermission {
  id: number;
  name: string;
  module: string;
  action: string;
}

export interface AdminUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: AdminRole[];
  permissions?: AdminPermission[];
  permissionsGroupedByModule?: { module: string; permissions: AdminPermission[] }[];
}

export interface LoginApiResponse {
  accessToken: string;
  admin: AdminUser;
}


export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
      strategy: "jwt",
      maxAge: 60 * 30, // 30 minutes
      updateAge: 0, // update session age every 1 minute
  },
  pages: {
      signIn: "/login",
      signOut: "/login",
  },
  callbacks: {
      async jwt({ token, user }: { token: Record<string, unknown>; user?: Record<string, unknown> }) {
          if (user && typeof user === "object" && "accessToken" in user && "admin" in user) {
              const api = user as unknown as LoginApiResponse;
              token.accessToken = api.accessToken;
              // Keep JWT cookie small to avoid 431 "Request Header Fields Too Large".
              // Store only minimal admin identity + roles, not full permission objects.
              token.admin = {
                  id: api.admin.id,
                  firstName: api.admin.firstName ?? null,
                  lastName: api.admin.lastName ?? null,
                  email: api.admin.email,
                  roles: api.admin.roles ?? [],
              };
              token.email = api.admin.email;
              token.name = [api.admin.firstName, api.admin.lastName].filter(Boolean).join(" ") || api.admin.email;
              token.sub = String(api.admin.id);
              token.roles = api.admin.roles;
              token.permissions = (api.admin.permissions ?? []).map((p) => p.name);
              token.firstName = api.admin.firstName;
              token.lastName = api.admin.lastName;
          }
          return token;
      },
      async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
          if (token.accessToken) {
              session.accessToken = token.accessToken as string;
              session.admin = token.admin as AdminUser;
              session.roles = token.roles as AdminRole[];
              session.permissions = (token.permissions as string[]) ?? [];
              session.id = token.sub as string;
              session.firstName = token.firstName as string;
              session.lastName = token.lastName as string;
              session.email = token.email as string;
          }
          const user = session?.user as { email?: string; name?: string; roles?: AdminRole[] } | undefined;
          if (user && token.email) {
              user.email = (token.email as string) ?? user.email;
              user.name = (token.name as string) ?? user.name;
              user.roles = (token.roles as AdminRole[]) ?? [];
          }
          return session;
      },
  },
  providers:[
      CredentialsProvider({
          id: "credentials",
          name : "credentials",
          credentials:{
              email : {label : "email", type: "email"},
              password: {label: "password", type: "password"}
          },
          authorize: async (credentials) => {
              // Debug: logs appear in the terminal (server), not the browser console
              // console.log("[Auth] CredentialsProvider authorize called");
              // console.log("[Auth] email:", credentials?.email);
              // console.log("[Auth] password:", credentials?.password);

              if(!credentials?.email || !credentials?.password){
                  throw new Error("Invalid credentials");
              }

              /**
               * @description AdminLogin to the API and get the access token
               * @param credentials
               * @returns {Promise<any>}
               */
              try {
                  const response = await axios.post<unknown>(
                      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
                      {
                      email: credentials.email,
                      password: credentials.password,
                      }
                  );
                  if (response.status !== 200) {
                      return null;
                  }
                  return extractResponseData(response.data);
              } catch {
                  return null;
              }
          }
      })
  ]
}