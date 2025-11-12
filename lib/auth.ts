import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'

declare module "next-auth" {
  interface Session {
    user: {
      id: number
      email: string
      name?: string | null
      image?: string | null
      role?: 'admin' | 'user' | 'coach' | 'student'
    } & DefaultSession["user"]
  }
  
  interface User {
    id: number
    role?: 'admin' | 'user' | 'coach' | 'student'
  }

  interface JWT {
    id?: number
    role?: 'admin' | 'user' | 'coach' | 'student'
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
          // Import dinámico en runtime
          const { prisma } = await import('@/lib/prisma')

          // Buscar usuario en la base de datos usando Prisma
          const email = credentials.email as string
          const foundUser = await prisma.user.findUnique({
            where: { email },
            include: {
              roles: {
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          })

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
          const userRole = foundUser.roles[0]

          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            image: foundUser.image,
            role: (userRole?.role as 'admin' | 'user' | 'coach' | 'student') || 'user'
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
      if (session.user && token && token.id) {
        (session.user as any).id = token.id as number
        (session.user as any).role = token.role as 'admin' | 'user' | 'coach' | 'student' | undefined
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