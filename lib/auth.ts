import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { sql } from './neon'
import bcrypt from 'bcryptjs'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: 'admin' | 'user'
    } & DefaultSession["user"]
  }
  
  interface User {
    role?: 'admin' | 'user'
  }

  interface JWT {
    id?: string
    role?: 'admin' | 'user'
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos')
        }

        try {
          // Buscar usuario en la base de datos usando template literals de Neon
          const userResult = await sql`SELECT id, email, name, image, password FROM users WHERE email = ${credentials.email}`
          const foundUser = userResult && userResult.length > 0 ? userResult[0] : null

          if (!foundUser) {
            throw new Error('Email o contraseña incorrectos')
          }

          // Limpiar la contraseña de espacios en blanco
          const cleanPassword = (credentials.password as string)?.trim()

          // Verificar contraseña
          const isValid = await bcrypt.compare(
            cleanPassword,
            foundUser.password
          )

          if (!isValid) {
            throw new Error('Email o contraseña incorrectos')
          }

          // Obtener rol del usuario
          const roleResult = await sql`SELECT role FROM user_roles_simple WHERE user_id = ${foundUser.id}`
          const userRole = roleResult && roleResult.length > 0 ? roleResult[0] : null

          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            image: foundUser.image,
            role: userRole?.role || 'user'
          }
        } catch (error) {
          console.error('Auth error:', error)
          // Si ya es un Error con mensaje, lanzarlo de nuevo
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Error al iniciar sesión. Intenta nuevamente.')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'admin' | 'user' | undefined
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt"
  }
})