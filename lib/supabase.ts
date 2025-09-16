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
      // Tablas del sistema de roles simplificado
      user_roles_simple: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      admin_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          organization_name: string | null
          organization_type: string | null
          bio: string | null
          avatar_url: string | null
          contact_phone: string | null
          contact_email: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          organization_name?: string | null
          organization_type?: string | null
          bio?: string | null
          avatar_url?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          organization_name?: string | null
          organization_type?: string | null
          bio?: string | null
          avatar_url?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_user_assignments: {
        Row: {
          id: string
          admin_id: string
          user_id: string
          assigned_at: string
          is_active: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          user_id: string
          assigned_at?: string
          is_active?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          user_id?: string
          assigned_at?: string
          is_active?: boolean
          notes?: string | null
        }
      }
      workout_sheet_assignments: {
        Row: {
          id: string
          workout_sheet_id: string
          user_id: string
          admin_id: string
          assigned_at: string
          due_date: string | null
          is_completed: boolean
          completed_at: string | null
          user_notes: string | null
          admin_feedback: string | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_sheet_id: string
          user_id: string
          admin_id: string
          assigned_at?: string
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          user_notes?: string | null
          admin_feedback?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_sheet_id?: string
          user_id?: string
          admin_id?: string
          assigned_at?: string
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          user_notes?: string | null
          admin_feedback?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          workout_sheet_id: string
          admin_id: string
          progress_data: any
          notes: string | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_sheet_id: string
          admin_id: string
          progress_data?: any
          notes?: string | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_sheet_id?: string
          admin_id?: string
          progress_data?: any
          notes?: string | null
          completed_at?: string
          created_at?: string
        }
      }
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
      workout_sheets: {
        Row: {
          id: string
          admin_id: string | null
          category_id: string | null
          title: string
          description: string | null
          content: any
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration: number | null
          equipment_needed: string[]
          tags: string[]
          is_template: boolean
          is_public: boolean
          plan_required: string | null
          template_data: any | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          category_id?: string | null
          title: string
          description?: string | null
          content?: any
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration?: number | null
          equipment_needed?: string[]
          tags?: string[]
          is_template?: boolean
          is_public?: boolean
          plan_required?: string | null
          template_data?: any | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          category_id?: string | null
          title?: string
          description?: string | null
          content?: any
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_duration?: number | null
          equipment_needed?: string[]
          tags?: string[]
          is_template?: boolean
          is_public?: boolean
          plan_required?: string | null
          template_data?: any | null
          is_active?: boolean
          created_by?: string | null
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
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          mercadopago_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          mercadopago_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          mercadopago_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected'
          mercadopago_payment_id: string | null
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected'
          mercadopago_payment_id?: string | null
          payment_method: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected'
          mercadopago_payment_id?: string | null
          payment_method?: string
          created_at?: string
          updated_at?: string
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