import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongo';
import BaseUser from '@/models/base_user';
import { logDebug } from '@/lib/debug-logger';

const authOptions = {
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

                logDebug("Authorize: Found user", user ? { email: user.email, role: user.role, uuid: user.uuid } : "NOT FOUND");
                if (user) logDebug("Authorize: User role:", user.role);

                if (user && user.password && await user.comparePassword(password)) {
                    logDebug("Authorize: Password match. Returning user object.");
                    return {
                        id: user.uuid,
                        name: user.name,
                        email: user.email,
                        enrollmentNumber: user.enrollmentNumber,
                        course: user.course,
                        semester: user.semester,
                        role: user.role, // ✅ Critical: Return role
                    };
                }

                logDebug("Authorize: Password mismatch or user not found/no password.");
                return null;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                logDebug("JWT Callback: User logged in. Role:", user.role);
                token.uuid = user.id;
                token.name = user.name;
                token.email = user.email;
                token.enrollmentNumber = user.enrollmentNumber;
                token.course = user.course;
                token.semester = user.semester;
                token.role = user.role; // ✅ Persist role to token
            }
            // console.log("JWT Callback: Token role:", token.role);
            return token;
        },
        async session({ session, token }) {
            if (token) {
                // console.log("Session Callback: Token role:", token.role);
                session.user = {
                    uuid: token.uuid,
                    name: token.name,
                    email: token.email,
                    role: token.role, // ✅ Persist role to session
                };
                logDebug("Session Callback: Session user role:", session.user.role);
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/', // Redirect to home/login if not signed in
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
