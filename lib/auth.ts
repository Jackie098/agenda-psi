import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        whatsapp: { label: "WhatsApp", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email && !credentials?.whatsapp) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email || "" },
              { whatsapp: credentials.whatsapp || "" },
            ],
          },
          include: {
            patient: true,
            psychologist: true,
          },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          patientId: user.patient?.id,
          psychologistId: user.psychologist?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.patientId = user.patientId;
        token.psychologistId = user.psychologistId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.patientId = token.patientId as string | undefined;
        session.user.psychologistId = token.psychologistId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

