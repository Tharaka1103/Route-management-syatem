import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Driver from '@/models/Driver'
import { UserRole, Department } from '@/types'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        nic: { label: "NIC", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials) return null

        await dbConnect()

        try {
          if (credentials.loginType === 'driver') {
            const driver = await Driver.findOne({ nic: credentials.nic })
            
            if (driver && bcrypt.compareSync(credentials.password, driver.password)) {
              return {
                id: driver._id.toString(),
                email: driver.email || '',
                name: driver.fullName,
                role: 'driver' as UserRole,
                userType: 'driver' as UserRole,
                department: undefined
              }
            }
          } else {
            const user = await User.findOne({ email: credentials.email })
            
            if (user && user.password && bcrypt.compareSync(credentials.password, user.password)) {
              return {
                id: user._id.toString(),
                email: user.email,
                name: user.fullName,
                role: user.role as UserRole,
                userType: user.role as UserRole,
                department: user.department as Department
              }
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }

        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await dbConnect()
        
        const existingUser = await User.findOne({ 
          $or: [
            { email: user.email },
            { googleId: account.providerAccountId }
          ]
        })

        if (!existingUser) {
          // Create new user - they'll need to complete registration with department
          const newUser = new User({
            email: user.email,
            fullName: user.name,
            image: user.image,
            googleId: account.providerAccountId,
            role: 'user'
          })
          await newUser.save()
          
          user.id = newUser._id.toString()
          user.role = 'user'
          user.userType = 'user'
        } else {
          user.id = existingUser._id.toString()
          user.role = existingUser.role
          user.userType = existingUser.role
          user.department = existingUser.department
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userType = user.userType
        token.department = user.department
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.userType = token.userType as UserRole
        session.user.department = token.department as Department
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt'
  }
}
