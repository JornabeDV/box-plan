/**
 * Guards para validar features en APIs
 * Estas funciones verifican que el estudiante tenga acceso a funcionalidades específicas
 */

import { NextResponse } from 'next/server'
import { studentHasFeature } from './coach-plan-features'

interface FeatureGuardResult {
  allowed: boolean
  response?: NextResponse
}

/**
 * Verifica si el estudiante tiene acceso a una feature específica
 * Retorna un objeto con allowed=true si tiene acceso, o allowed=false con response 403
 */
export async function requireFeature(
  userId: number,
  feature: 'score_loading' | 'score_database' | 'whatsapp_integration' | 'community_forum' | 'timer' | 'personalized_planifications',
  featureName: string
): Promise<FeatureGuardResult> {
  try {
    const hasAccess = await studentHasFeature(userId, feature)
    
    if (!hasAccess) {
      return {
        allowed: false,
        response: NextResponse.json(
          { 
            error: `Tu plan no incluye la funcionalidad de ${featureName}.`,
            code: 'FEATURE_NOT_AVAILABLE',
            feature: feature
          },
          { status: 403 }
        )
      }
    }
    
    return { allowed: true }
  } catch (error) {
    console.error(`Error al validar feature ${feature}:`, error)
    // En caso de error, permitir el acceso para no bloquear al usuario por problemas técnicos
    // pero loguear el error para investigación
    return { allowed: true }
  }
}

/**
 * Verifica acceso a la carga de scores (WOD, Strength, RM)
 */
export async function requireProgressTracking(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'score_loading', 'registro de scores y seguimiento de progreso')
}

/**
 * Verifica acceso al ranking/leaderboard
 */
export async function requireRankingAccess(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'score_database', 'ranking y base de datos de scores')
}

/**
 * Verifica acceso a la comunidad/foro
 */
export async function requireCommunityAccess(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'community_forum', 'comunidad y foro')
}

/**
 * Verifica acceso a WhatsApp
 */
export async function requireWhatsAppAccess(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'whatsapp_integration', 'soporte por WhatsApp')
}

/**
 * Verifica acceso al cronómetro
 */
export async function requireTimerAccess(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'timer', 'cronómetro profesional')
}

/**
 * Verifica acceso a planificaciones personalizadas
 */
export async function requirePersonalizedPlanifications(userId: number): Promise<FeatureGuardResult> {
  return requireFeature(userId, 'personalized_planifications', 'planificaciones personalizadas')
}
