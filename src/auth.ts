import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { verifyUser } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(credentials);

                if (parsed.success) {
                    const user = await verifyUser(parsed.data.email, parsed.data.password);
                    if (user) {
                        return { id: user.id, name: user.email, email: user.email };
                    }
                }

                return null;
            },
        }),
    ],
});
