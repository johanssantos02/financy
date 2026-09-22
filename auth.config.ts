import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const { pathname } = nextUrl;
      const isPublicRoute =
        pathname === "/login" || pathname === "/cadastro";

      if (!isAuthenticated && !isPublicRoute) return false;
      if (isAuthenticated && isPublicRoute) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
};
