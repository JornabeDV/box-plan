import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
}

// Cliente de Supabase para el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente de Supabase para operaciones del servidor (con service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
)

// Tipos de la base de datos
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wods: {
        Row: {
          id: string
          name: string
          description: string
          type: 'metcon' | 'strength' | 'skill' | 'endurance'
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes: number | null
          exercises: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: 'metcon' | 'strength' | 'skill' | 'endurance'
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes?: number | null
          exercises: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: 'metcon' | 'strength' | 'skill' | 'endurance'
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          duration_minutes?: number | null
          exercises?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          wod_id: string
          completed_at: string
          duration_seconds: number | null
          score: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wod_id: string
          completed_at: string
          duration_seconds?: number | null
          score?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wod_id?: string
          completed_at?: string
          duration_seconds?: number | null
          score?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      personal_records: {
        Row: {
          id: string
          user_id: string
          exercise: string
          weight: number | null
          reps: number | null
          time_seconds: number | null
          date_achieved: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise: string
          weight?: number | null
          reps?: number | null
          time_seconds?: number | null
          date_achieved: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise?: string
          weight?: number | null
          reps?: number | null
          time_seconds?: number | null
          date_achieved?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}