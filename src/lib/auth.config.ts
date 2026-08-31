import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe slice of the auth config. No database / bcrypt here so it can run
 * inside `middleware.ts`. The Credentials provider + Prisma adapter live in
 * `auth.ts`, which runs on the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAppRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/terms") ||
        nextUrl.pathname.startsWith("/categories") ||
        nextUrl.pathname.startsWith("/collections") ||
        nextUrl.pathname.startsWith("/graph") ||
        nextUrl.pathname.startsWith("/assistant") ||
        nextUrl.pathname.startsWith("/quizzes") ||
        nextUrl.pathname.startsWith("/review") ||
        nextUrl.pathname.startsWith("/sources") ||
        nextUrl.pathname.startsWith("/stats") ||
        nextUrl.pathname.startsWith("/history") ||
        nextUrl.pathname.startsWith("/settings") ||
        nextUrl.pathname.startsWith("/import-export") ||
        nextUrl.pathname.startsWith("/trash");

      if (isAppRoute) return isLoggedIn;

      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
