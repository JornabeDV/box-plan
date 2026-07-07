import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAnyAdmin, normalizeUserId } from '@/lib/auth-server-helpers'

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

    // Determinar autorización y coachId asociado
    let coachIdNum: number | null = null

    const [authCheck, adminCheck] = await Promise.all([
      isCoach(userId),
      isAnyAdmin(userId)
    ])

    if (adminCheck) {
      // Los administradores pueden crear suscripciones para cualquier usuario,
      // pero solo usamos coach_id del body si es un número válido.
      if (coach_id !== undefined && coach_id !== null) {
        const parsedCoachId = typeof coach_id === 'string' ? parseInt(coach_id, 10) : coach_id
        if (!isNaN(parsedCoachId) && typeof parsedCoachId === 'number') {
          coachIdNum = parsedCoachId
        }
      }
    } else if (authCheck.isAuthorized && authCheck.profile) {
      // El usuario autenticado es coach: solo puede crear suscripciones para sus estudiantes
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: authCheck.profile.id,
          studentId: userIdNum,
          status: 'active'
        }
      })

      if (!relationship) {
        return NextResponse.json(
          { error: 'No autorizado para crear suscripciones para este usuario' },
          { status: 403 }
        )
      }

      coachIdNum = authCheck.profile.id
    } else {
      // Usuario común: solo puede crear su propia suscripción
      if (userIdNum !== userId) {
        return NextResponse.json(
          { error: 'No autorizado para crear suscripciones para otro usuario' },
          { status: 403 }
        )
      }

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

    // Verificar que el plan pertenezca al coach o sea global (excepto para admins)
    if (!adminCheck && plan.coachId !== null && plan.coachId !== coachIdNum) {
      return NextResponse.json(
        { error: 'No autorizado para asignar este plan' },
        { status: 403 }
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