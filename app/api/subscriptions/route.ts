import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, normalizeUserId } from '@/lib/auth-helpers'

// POST /api/subscriptions
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

    const body = await request.json()
    const {
      user_id,
      plan_id,
      status = 'active',
      current_period_start,
      current_period_end,
      cancel_at_period_end = false,
      payment_method = 'admin_assignment',
      coach_id // Opcional: puede venir del body si se pasa explícitamente
    } = body

    if (!user_id || !plan_id) {
      return NextResponse.json(
        { error: 'user_id y plan_id son requeridos' },
        { status: 400 }
      )
    }

    // Convertir user_id y plan_id a números enteros
    const userIdNum = typeof user_id === 'string' ? parseInt(user_id, 10) : user_id
    const planIdNum = typeof plan_id === 'string' ? parseInt(plan_id, 10) : plan_id

    if (isNaN(userIdNum) || isNaN(planIdNum)) {
      return NextResponse.json(
        { error: 'user_id y plan_id deben ser números válidos' },
        { status: 400 }
      )
    }

    // Determinar el coachId
    let coachIdNum: number | null = null
    
    // Si viene explícitamente en el body, usarlo
    if (coach_id !== undefined && coach_id !== null) {
      const parsedCoachId = typeof coach_id === 'string' ? parseInt(coach_id, 10) : coach_id
      if (!isNaN(parsedCoachId) && typeof parsedCoachId === 'number') {
        coachIdNum = parsedCoachId
      }
    } else {
      // Si no viene en el body, buscar el coach asociado al estudiante
      // Primero verificar si el usuario autenticado es coach
      const authCheck = await isCoach(userId)
      if (authCheck.isAuthorized && authCheck.profile) {
        const coachId = authCheck.profile.id
        
        // Verificar que el estudiante esté asociado a este coach
        const relationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            coachId: coachId,
            studentId: userIdNum,
            status: 'active'
          }
        })
        
        if (relationship) {
          coachIdNum = coachId
        }
      } else {
        // Si el usuario autenticado no es coach, buscar el coach del estudiante
        // (esto ocurre cuando un estudiante crea su propia suscripción)
        const studentRelationship = await prisma.coachStudentRelationship.findFirst({
          where: {
            studentId: userIdNum,
            status: 'active'
          }
        })
        
        if (studentRelationship) {
          coachIdNum = studentRelationship.coachId
        }
      }
    }

    // Obtener información del plan para el registro de pago
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planIdNum }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Crear la suscripción y el registro de pago en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const subscriptionData: any = {
        userId: userIdNum,
        planId: planIdNum,
        status,
        currentPeriodStart: new Date(current_period_start),
        currentPeriodEnd: new Date(current_period_end),
        cancelAtPeriodEnd: cancel_at_period_end
      }

      // Incluir coachId si está disponible
      if (coachIdNum !== null) {
        subscriptionData.coachId = coachIdNum
      }

      // Incluir método de pago
      if (payment_method) {
        subscriptionData.paymentMethod = payment_method
      }

      const newSubscription = await tx.subscription.create({
        data: subscriptionData
      })

      // Crear registro de pago en payment_history
      try {
        await tx.paymentHistory.create({
          data: {
            userId: userIdNum,
            subscriptionId: newSubscription.id,
            amount: plan.price,
            currency: plan.currency,
            status: 'approved',
            paymentMethod: payment_method
          }
        })
      } catch (paymentError) {
        console.error('Error creating payment history:', paymentError)
      }

      return newSubscription
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}