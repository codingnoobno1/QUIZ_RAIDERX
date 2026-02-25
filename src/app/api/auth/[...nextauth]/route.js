import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongo';
import BaseUser from '@/models/base_user';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        await connectDB();
        const user = await BaseUser.findOne({ email: email.trim().toLowerCase() });

        if (user && await user.comparePassword(password)) {
          return {
            id: user.uuid,
            name: user.name,
            email: user.email,
            enrollmentNumber: user.enrollmentNumber,
            course: user.course,
            semester: user.semester,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 15, // 15 minutes
    updateAge: 5 * 60, // refresh JWT every 5 minutes
  },
  jwt: {
    maxAge: 60 * 15, // 15 minutes
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15,
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.uuid = user.id;
        token.name = user.name;
        token.email = user.email;
        token.enrollmentNumber = user.enrollmentNumber;
        token.course = user.course;
        token.semester = user.semester;
        token.role = user.role; // Add role to token
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          uuid: token.uuid,
          name: token.name,
          email: token.email,
          enrollmentNumber: token.enrollmentNumber,
          course: token.course,
          semester: token.semester,
          role: token.role, // Add role to session
        };
        // Include expiry explicitly (ISO format)
        if (token.exp) {
          session.expires = new Date(token.exp * 1000).toISOString();
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
