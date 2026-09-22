import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { clientePrisma } from "@/src/shared/api/prisma";

const schemaCredenciais = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      async authorize(credentials) {
        const parsed = schemaCredenciais.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await clientePrisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
          },
        });

        if (!usuario) return null;

        const senhaCorreta = await bcrypt.compare(
          parsed.data.senha,
          usuario.passwordHash
        );
        if (!senhaCorreta) return null;

        return {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          role: usuario.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.role = (user as { role: "USER" | "ADMIN" }).role;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as "USER" | "ADMIN";
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      name?: string | null;
      email?: string | null;
    };
  }
  interface User {
    role?: "USER" | "ADMIN";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
  }
}
