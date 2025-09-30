
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const referenciador = await prisma.referenciador.findUnique({
            where: { correo: credentials.email },
            include: { user: true }
          });

          if (!referenciador) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, referenciador.password);
          if (!isValid) {
            return null;
          }

          return {
            id: referenciador.userId,
            email: referenciador.correo,
            name: referenciador.nombre,
            role: referenciador.tipoUsuario,
            referenciadorId: referenciador.id
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.referenciadorId = user.referenciadorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.referenciadorId = token.referenciadorId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
