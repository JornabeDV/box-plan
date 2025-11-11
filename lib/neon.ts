import { neon } from '@neondatabase/serverless'

// String de conexión de Neon PostgreSQL
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL

// Crear cliente de Neon solo si tenemos connectionString
export const sql = connectionString ? neon(connectionString) : (() => {
  throw new Error('Database connection not configured. Set DATABASE_URL or NEON_DATABASE_URL environment variable.')
})()

// Interfaces para los tipos de base de datos
export interface User {
  id: number
  email: string
  emailVerified: Date | null
  name: string | null
  image: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  userId: number
  expiresAt: Date
  token: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Profile {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: number
  user_id: number
  role: 'admin' | 'user' | 'coach' | 'student'
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: number
  user_id: number
  plan_id: number
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  mercadopago_payment_id: string | null
  created_at: string
  updated_at: string
}