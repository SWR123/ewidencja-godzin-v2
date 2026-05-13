import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            console.log('[AUTH] User not found:', credentials.email);
            return null;
          }

          const isValid = await compare(credentials.password as string, user.password || '');
          
          if (!isValid) {
            console.log('[AUTH] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login successful for:', user.email, 'requirePasswordReset:', user.requirePasswordReset);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user as any).role,
            requirePasswordReset: user.requirePasswordReset,
          };
        } catch (error: any) {
          console.error('[AUTH] Error during login:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.requirePasswordReset = u.requirePasswordReset;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).requirePasswordReset = token.requirePasswordReset;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        if ((user as any).requirePasswordReset) {
          return '/zmiana-hasla';
        }
        return true;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/zmiana-hasla')) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/logowanie',
    error: '/logowanie',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const auth = getServerSession;
