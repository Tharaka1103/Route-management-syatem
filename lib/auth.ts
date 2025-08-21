import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import {connectDB} from './mongodb';
import User from '@/models/User';
import Driver from '@/models/Driver';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'NIC/Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        await connectDB();

        try {
          if (credentials.userType === 'driver') {
            const driver = await Driver.findOne({ nic: credentials.identifier });
            if (driver && await bcrypt.compare(credentials.password, driver.password)) {
              return {
                id: driver._id.toString(),
                name: driver.fullName,
                email: driver.email || '',
                role: 'driver',
                userType: 'driver'
              };
            }
          } else {
            const user = await User.findOne({ email: credentials.identifier });
            if (user && credentials.password === 'admin123') { // Simplified for demo
              return {
                id: user._id.toString(),
                name: user.fullName,
                email: user.email,
                role: user.role,
                department: user.department,
                userType: 'user'
              };
            }
          }
        } catch (error) {
          console.error('Auth error:', error);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await connectDB();
        
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          return '/auth/complete-profile';
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.userType = token.userType;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};