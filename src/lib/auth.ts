import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query } from "./db";

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

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
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          console.log("[AUTH] Login attempt for:", credentials?.email);
          
          if (!credentials?.email) {
            console.log("[AUTH] Missing email");
            return null;
          }

          const email = (credentials.email as string).toLowerCase().trim();

          // OTP Token login (passwordless)
          if (credentials.otpToken) {
            console.log("[AUTH] Attempting OTP token login");
            
            const tokenResult = await query(
              `SELECT * FROM login_tokens WHERE email = $1`,
              [email]
            );

            if (tokenResult.rows.length === 0) {
              console.log("[AUTH] No token found for email");
              return null;
            }

            const tokenRecord = tokenResult.rows[0];

            // Timing-safe token comparison
            if (!safeCompare(tokenRecord.token, credentials.otpToken as string)) {
              console.log("[AUTH] Invalid OTP token");
              return null;
            }

            // Check expiry
            if (new Date(tokenRecord.expires_at) < new Date()) {
              console.log("[AUTH] OTP token expired");
              await query(`DELETE FROM login_tokens WHERE email = $1`, [email]);
              return null;
            }

            // Delete the used token
            await query(`DELETE FROM login_tokens WHERE email = $1`, [email]);

            // Get user
            const userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
            const user = userResult.rows[0];

            if (!user) {
              console.log("[AUTH] User not found for OTP login");
              return null;
            }

            console.log("[AUTH] OTP login successful for:", email);
            return {
              id: String(user.id),
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.avatar_url,
            };
          }

          // Password login (traditional)
          if (!credentials.password) {
            console.log("[AUTH] Missing password");
            return null;
          }

          const result = await query("SELECT * FROM users WHERE email = $1", [email]);
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
