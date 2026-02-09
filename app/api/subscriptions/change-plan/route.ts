import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'

// POST /api/subscriptions/change-plan
// Cambia el plan de suscripción de un usuario
// - Si es el propio usuario: newPlanId, currentSubscriptionId
// - Si es un coach cambiando el plan de un estudiante: newPlanId, currentSubscriptionId, targetUserId
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    const currentUserId = normalizeUserId(session?.user?.id)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { newPlanId, currentSubscriptionId, targetUserId } = await request.json()

    if (!newPlanId) {
      return NextResponse.json(
        { error: 'Parámetros faltantes' },
        { status: 400 }
      )
    }

    // Convertir IDs a números enteros
    const newPlanIdNum = typeof newPlanId === 'string' ? parseInt(newPlanId, 10) : newPlanId

    if (isNaN(newPlanIdNum)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      )
    }

    // Obtener nuevo plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanIdNum }
    })

    if (!newPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    let currentSubscriptionRaw: { id: number; userId: number; coachId: number | null; paymentMethod?: string | null } | null = null

    if (currentSubscriptionId) {
      // Si se proporciona currentSubscriptionId, usarlo directamente
      const subscriptionIdNum = typeof currentSubscriptionId === 'string' ? parseInt(currentSubscriptionId, 10) : currentSubscriptionId
      if (!isNaN(subscriptionIdNum)) {
        currentSubscriptionRaw = await prisma.subscription.findUnique({
          where: { id: subscriptionIdNum }
        }) as { id: number; userId: number; coachId: number | null; paymentMethod?: string | null } | null
      }
    }

    // Si no se encontró por ID o no se proporcionó, buscar la suscripción activa del targetUserId
    if (!currentSubscriptionRaw && targetUserId) {
      const targetUserIdNum = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId
      if (!isNaN(targetUserIdNum)) {
        currentSubscriptionRaw = await prisma.subscription.findFirst({
          where: { 
            userId: targetUserIdNum,
            status: 'active'
          },
          orderBy: { createdAt: 'desc' }
        }) as { id: number; userId: number; coachId: number | null; paymentMethod?: string | null } | null
      }
    }
    
    if (!currentSubscriptionRaw) {
      return NextResponse.json(
        { error: 'No se encontró una suscripción activa para este usuario' },
        { status: 404 }
      )
    }

    // Extraer método de pago de la suscripción actual
    const currentSubscription = {
      coachId: currentSubscriptionRaw.coachId,
      paymentMethod: (currentSubscriptionRaw as any).paymentMethod || null
    }
    
    // Determinar el usuario objetivo (quién está cambiando de plan)
    let targetUserIdNum: number
    let isCoachAction = false
    let coachIdNum: number | null = currentSubscriptionRaw.coachId ?? null
    
    if (targetUserId && targetUserId !== String(currentUserId)) {
      // Un coach está cambiando el plan de un estudiante
      const authCheck = await isCoach(currentUserId)
      if (!authCheck.isAuthorized || !authCheck.profile) {
        return NextResponse.json(
          { error: 'No autorizado. Solo coaches pueden cambiar planes de otros usuarios.' },
          { status: 403 }
        )
      }
      
      // Verificar que el estudiante esté asociado a este coach
      const targetUserIdParsed = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId
      if (isNaN(targetUserIdParsed)) {
        return NextResponse.json(
          { error: 'ID de usuario objetivo inválido' },
          { status: 400 }
        )
      }
      
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: authCheck.profile.id,
          studentId: targetUserIdParsed,
          status: 'active'
        }
      })
      
      if (!relationship) {
        return NextResponse.json(
          { error: 'No autorizado. El usuario no es tu estudiante.' },
          { status: 403 }
        )
      }
      
      // Verificar que la suscripción pertenezca al estudiante objetivo
      if (currentSubscriptionRaw.userId !== targetUserIdParsed) {
        return NextResponse.json(
          { error: 'La suscripción no pertenece al usuario especificado' },
          { status: 403 }
        )
      }
      
      targetUserIdNum = targetUserIdParsed
      coachIdNum = authCheck.profile.id
      isCoachAction = true
    } else {
      // El usuario está cambiando su propio plan
      targetUserIdNum = currentUserId
      
      // Verificar que la suscripción pertenezca al usuario autenticado
      if (currentSubscriptionRaw.userId !== currentUserId) {
        return NextResponse.json(
          { error: 'No autorizado. La suscripción no te pertenece.' },
          { status: 403 }
        )
      }
      
      // Si no hay coachId en la suscripción, buscar el coach del estudiante
      if (coachIdNum === null) {
        const studentRelationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            studentId: currentUserId,
            status: 'active'
          }
        })
        
        if (studentRelationship) {
          coachIdNum = studentRelationship.coachId
        }
      }
    }

    // Crear nueva suscripción y actualizar la actual en una transacción
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30) // 30 días

    const result = await prisma.$transaction(async (tx) => {
      // Cancelar TODAS las suscripciones activas del usuario objetivo inmediatamente
      await tx.subscription.updateMany({
        where: {
          userId: targetUserIdNum,
          status: 'active'
        },
        data: {
          status: 'canceled',
          cancelAtPeriodEnd: true
        }
      })

      // Crear nueva suscripción
      const subscriptionData: any = {
        userId: targetUserIdNum,
        planId: newPlanIdNum,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: newEndDate,
        cancelAtPeriodEnd: false,
        mercadopagoPaymentId: `change_${Date.now()}`
      }

      // Mantener método de pago anterior o usar 'plan_change'
      if (currentSubscription?.paymentMethod) {
        subscriptionData.paymentMethod = currentSubscription.paymentMethod
      } else {
        subscriptionData.paymentMethod = 'plan_change'
      }

      // Incluir coachId si está disponible
      if (coachIdNum !== null) {
        subscriptionData.coachId = coachIdNum
      }

      const newSubscription = await tx.subscription.create({
        data: subscriptionData
      })

      // Crear registro de pago usando el mismo método de pago de la suscripción
      const paymentMethodForHistory = currentSubscription?.paymentMethod || subscriptionData.paymentMethod || 'manual'
      
      await tx.paymentHistory.create({
        data: {
          userId: targetUserIdNum,
          subscriptionId: newSubscription.id,
          amount: newPlan.price,
          currency: newPlan.currency,
          status: 'approved',
          mercadopagoPaymentId: `change_${Date.now()}`,
          paymentMethod: paymentMethodForHistory
        }
      })

      return newSubscription
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Error al cambiar plan' },
      { status: 500 }
    )
  }
}