import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'

// POST /api/subscriptions/change-plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { newPlanId, currentSubscriptionId } = await request.json()

    if (!newPlanId || !currentSubscriptionId) {
      return NextResponse.json(
        { error: 'Parámetros faltantes' },
        { status: 400 }
      )
    }

    // Convertir IDs a números enteros
    const newPlanIdNum = typeof newPlanId === 'string' ? parseInt(newPlanId, 10) : newPlanId
    const currentSubscriptionIdNum = typeof currentSubscriptionId === 'string' ? parseInt(currentSubscriptionId, 10) : currentSubscriptionId

    if (isNaN(newPlanIdNum) || isNaN(currentSubscriptionIdNum)) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
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

    // Obtener suscripción actual para mantener el método de pago y coachId
    // Usar findUnique y hacer cast para incluir paymentMethod que puede no estar en los tipos generados
    const currentSubscriptionRaw = await prisma.subscription.findUnique({
      where: { id: currentSubscriptionIdNum }
    }) as { coachId: number | null; paymentMethod?: string | null } | null
    
    const currentSubscription = currentSubscriptionRaw ? {
      coachId: currentSubscriptionRaw.coachId,
      paymentMethod: (currentSubscriptionRaw as any).paymentMethod || null
    } : null

    // Determinar el coachId si no existe en la suscripción actual
    let coachIdNum: number | null = currentSubscription?.coachId ?? null
    
    if (coachIdNum === null) {
      // Buscar el coach asociado al estudiante
      const authCheck = await isCoach(userId)
      if (authCheck.isAuthorized && authCheck.profile) {
        const coachId = authCheck.profile.id
        
        // Verificar que el estudiante esté asociado a este coach
        const relationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            coachId: coachId,
            studentId: userId,
            status: 'active'
          }
        })
        
        if (relationship) {
          coachIdNum = coachId
        }
      } else {
        // Si el usuario autenticado no es coach, buscar el coach del estudiante
        const studentRelationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            studentId: userId,
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
      // Cancelar TODAS las suscripciones activas del usuario inmediatamente
      await tx.subscription.updateMany({
        where: {
          userId: userId,
          status: 'active'
        },
        data: {
          status: 'canceled',
          cancelAtPeriodEnd: true
        }
      })

      // Crear nueva suscripción
      const subscriptionData: any = {
        userId,
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
          userId,
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