import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnAuth = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isOnAuth) {
                if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
                return true;
            }
            return true; // Allow landing page and other routes
        },
        session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub; // Ensure ID is passed to session
            }
            return session;
        }
    },
    providers: [], // Providers array empty here to avoid Node.js modules in Edge
    trustHost: true,
} satisfies NextAuthConfig;
