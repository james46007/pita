import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptionsAdmin: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "default_pita_jwt_secret_key_32bytes_long",
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "auth-admin.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "AdminCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).trim().toLowerCase()
        const password = String(credentials.password)

        const user = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
          include: {
            complexes: {
              select: { complexId: true, role: true },
            },
          },
        })

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          complexes: user.complexes,
        } as any
      },
    }),
    CredentialsProvider({
      id: "cliente-credentials",
      name: "ClienteCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).trim().toLowerCase()
        const password = String(credentials.password)

        const customer = await prisma.customer.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
        })

        if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
          return null
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          isCustomer: true,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.isSuperAdmin = user.isSuperAdmin ?? false
        token.esSuperAdmin = user.isSuperAdmin ?? false
        token.complexes = user.complexes ?? []
        token.phone = user.phone
        token.isCustomer = user.isCustomer ?? false
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.isSuperAdmin = token.isSuperAdmin
        session.user.esSuperAdmin = token.isSuperAdmin
        session.user.complexes = token.complexes
        session.user.phone = token.phone
        session.user.isCustomer = token.isCustomer
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
