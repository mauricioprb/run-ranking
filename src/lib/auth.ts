import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "@/lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/painel/login",
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile && "login" in profile) {
        token.username = String(profile.login);
      }
      return token;
    },
    session({ session, token }) {
      if (token?.username && session.user) {
        session.user.username = token.username;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const isPainelRoute = request.nextUrl.pathname.startsWith("/painel");
      const isLoginPage = request.nextUrl.pathname === "/painel/login";

      if (isPainelRoute && !isLoginPage) {
        return !!session?.user;
      }

      return true;
    },
  },
});
