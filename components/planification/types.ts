export type TimerMode = 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm'

export interface TimerConfig {
  workTime?: string
  restTime?: string
  totalRounds?: string
  amrapTime?: string
}

export interface ExerciseRef {
  id: string
  name: string
  category?: string | null
  video_url?: string | null
  image_url?: string | null
}

export interface PlanificationItem {
  id: string
  description: string
  order: number
  exercise?: ExerciseRef | null
}

export interface SubBlock {
  id: string
  subtitle: string
  order: number
  items: PlanificationItem[]
  timer_mode?: TimerMode | null
  timer_config?: TimerConfig
}

export interface Block {
  id: string
  title: string
  order: number
  notes?: string
  items: PlanificationItem[]
  subBlocks?: SubBlock[]
  timer_mode?: TimerMode | null
  timer_config?: TimerConfig
}

export interface Planification {
  id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Block[]
  notes?: string
  is_personalized?: boolean
  target_user_id?: string | null
  target_user?: {
    id: string
    name: string
    email: string
  } | null
  discipline?: {
    id: string
    name: string
    color: string
    icon: string
  }
  discipline_level?: {
    id: string
    name: string
    description?: string
  }
}

export interface WorkoutScore {
  id: string
  duration_seconds: number | null
  completed_at: string | null
  weight?: number | null
}
