import type { NextAuthConfig } from "next-auth";

// Edge-compatible config (no DB imports) for middleware
export const authConfig: NextAuthConfig = {
  providers: [], // providers configured in full auth.ts
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAgent = nextUrl.pathname.startsWith("/agent");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as Record<string, unknown>)?.role;
        if (role !== "admin") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (isOnDashboard || isOnAgent) {
        return isLoggedIn;
      }

      return true;
    },
  },
  trustHost: true,
};
