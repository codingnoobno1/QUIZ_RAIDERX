import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDb, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'MasterCredentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        const pool = await connectDb();
        const result = await pool
          .request()
          .input('enrollmentNumber', sql.NVarChar, username)
          .query(`
            SELECT uuid, name, enrollmentNumber, course, semester, email, password AS hashedPassword, role
            FROM Users
            WHERE enrollmentNumber = @enrollmentNumber AND role = 'admin'
          `);

        const user = result.recordset[0];

        if (user && await bcrypt.compare(password, user.hashedPassword)) {
          return {
            id: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/master',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
