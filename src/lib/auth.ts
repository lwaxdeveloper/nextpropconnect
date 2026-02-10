import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("[AUTH] Login attempt for:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Missing credentials");
            return null;
          }

          const result = await query("SELECT * FROM users WHERE email = $1", [
            credentials.email,
          ]);

          const user = result.rows[0];
          console.log("[AUTH] User found:", !!user);
          if (!user || !user.password_hash) {
            console.log("[AUTH] No user or no password_hash");
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );
          console.log("[AUTH] Password valid:", valid);
          if (!valid) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar_url,
          };
        } catch (err) {
          console.error("[AUTH] Error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth }) {
      // Return true for middleware to allow the request
      // The actual auth check is done in middleware.ts
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  trustHost: true,
});
