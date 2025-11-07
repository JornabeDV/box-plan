import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// PATCH /api/subscription-plans/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const adminProfile = await sql`
      SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
    `

    if (adminProfile.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, currency, interval, features, is_active } = body

    // Verificar que hay al menos un campo para actualizar
    const hasUpdates = name !== undefined || 
                      description !== undefined || 
                      (price !== undefined && price !== null) || 
                      currency !== undefined || 
                      interval !== undefined || 
                      features !== undefined || 
                      is_active !== undefined

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Obtener el plan actual primero
    const currentPlan = await sql`
      SELECT * FROM subscription_plans WHERE id = ${params.id}
    `

    if (!currentPlan || currentPlan.length === 0) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Usar valores actuales si no se proporcionan nuevos
    const finalName = name !== undefined ? name : currentPlan[0].name
    const finalDescription = description !== undefined ? description : currentPlan[0].description
    const finalPrice = (price !== undefined && price !== null) ? price : currentPlan[0].price
    const finalCurrency = currency !== undefined ? currency : currentPlan[0].currency
    const finalInterval = interval !== undefined ? interval : currentPlan[0].interval
    const finalFeatures = features !== undefined ? features : (typeof currentPlan[0].features === 'string' ? JSON.parse(currentPlan[0].features) : currentPlan[0].features)
    const finalIsActive = is_active !== undefined ? is_active : currentPlan[0].is_active

    // Ejecutar UPDATE en una sola operación con todos los campos
    const result = await sql`
      UPDATE subscription_plans 
      SET 
        name = ${finalName},
        description = ${finalDescription},
        price = ${finalPrice},
        currency = ${finalCurrency},
        interval = ${finalInterval},
        features = ${JSON.stringify(finalFeatures)}::jsonb,
        is_active = ${finalIsActive},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (!result || result.length === 0 || !result[0]) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    const plan = result[0]
    const serializedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: typeof plan.price === 'object' && plan.price !== null ? Number(plan.price) : Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_active: plan.is_active,
      created_at: plan.created_at ? new Date(plan.created_at).toISOString() : null,
      updated_at: plan.updated_at ? new Date(plan.updated_at).toISOString() : null
    }

    return NextResponse.json(serializedPlan)
  } catch (error: any) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/subscription-plans/[id] - Soft delete (desactivar)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const adminProfile = await sql`
      SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
    `

    if (adminProfile.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que el plan existe
    const planExists = await sql`
      SELECT id FROM subscription_plans WHERE id = ${params.id}
    `

    if (planExists.length === 0) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Soft delete: desactivar el plan en lugar de eliminarlo
    // Esto permite mantener el historial de suscripciones
    const result = await sql`
      UPDATE subscription_plans
      SET is_active = false, updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    // Convertir valores de PostgreSQL a tipos JavaScript serializables
    const plan = result[0]
    const serializedPlan = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: typeof plan.price === 'object' && plan.price !== null ? Number(plan.price) : Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      is_active: plan.is_active,
      created_at: plan.created_at ? new Date(plan.created_at).toISOString() : null,
      updated_at: plan.updated_at ? new Date(plan.updated_at).toISOString() : null
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan desactivado exitosamente',
      plan: serializedPlan
    })
  } catch (error: any) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el plan' },
      { status: 500 }
    )
  }
}