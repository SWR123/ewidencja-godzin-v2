import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { prisma } from './db';
import {
  isEmailLimited,
  isIpLimited,
  recordEmailFailure,
  recordIpFailure,
  resetEmail,
  resetIp,
} from './rate-limit';

function getClientIp(req: any): string {
  if (!req) return '';
  const xff = req.headers?.['x-forwarded-for'] || req.headers?.get?.('x-forwarded-for');
  if (typeof xff === 'string' && xff) {
    return xff.split(',')[0].trim();
  }
  return '';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req: any) {
        try {
          const email = (credentials?.email as string) || '';
          const ip = getClientIp(req);

          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          // Rate-limit: blokada nieudanych prób per-email i per-IP
          if (isEmailLimited(email)) {
            console.log('[AUTH] BLOCKED (email rate-limit):', email);
            return null;
          }
          if (ip && isIpLimited(ip)) {
            console.log('[AUTH] BLOCKED (IP rate-limit):', ip);
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('[AUTH] User not found:', email);
            return null;
          }

          const isValid = await compare(credentials.password as string, user.password || '');

          if (!isValid) {
            recordEmailFailure(email);
            if (ip) recordIpFailure(ip);
            console.log('[AUTH] Invalid password for:', email);
            return null;
          }

          // Sukces — wyczyść liczniki
          resetEmail(email);
          if (ip) resetIp(ip);

          console.log('[AUTH] Login successful for:', user.email, 'role:', user.role, 'requirePasswordReset:', user.requirePasswordReset);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user as any).role,
            requirePasswordReset: user.requirePasswordReset,
          };
        } catch (error: any) {
          console.error('[AUTH] Error:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.requirePasswordReset = (user as any).requirePasswordReset;
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
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
