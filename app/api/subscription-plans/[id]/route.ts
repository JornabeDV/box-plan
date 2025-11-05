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

    console.log('Update request body:', body)
    console.log('Plan ID:', params.id)

    // Construir update dinámicamente
    const conditions: string[] = []
    
    if (name !== undefined) {
      conditions.push(`name = '${name.replace(/'/g, "''")}'`)
    }
    if (description !== undefined) {
      conditions.push(`description = ${description === null ? 'NULL' : `'${(description || '').replace(/'/g, "''")}'`}`)
    }
    if (price !== undefined && price !== null) {
      conditions.push(`price = ${price}`)
    }
    if (currency !== undefined) {
      conditions.push(`currency = '${currency.replace(/'/g, "''")}'`)
    }
    if (interval !== undefined) {
      conditions.push(`interval = '${interval.replace(/'/g, "''")}'`)
    }
    if (features !== undefined) {
      conditions.push(`features = '${JSON.stringify(features).replace(/'/g, "''")}'::jsonb`)
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = ${is_active}`)
    }
    
    if (conditions.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }
    
    conditions.push('updated_at = NOW()')
    const setClause = conditions.join(', ')

    // Ejecutar UPDATE - usar sql template literal con interpolación para campos dinámicos
    // Primero actualizar los campos dinámicamente
    if (name !== undefined) {
      await sql`UPDATE subscription_plans SET name = ${name}, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (description !== undefined) {
      await sql`UPDATE subscription_plans SET description = ${description}, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (price !== undefined && price !== null) {
      await sql`UPDATE subscription_plans SET price = ${price}, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (currency !== undefined) {
      await sql`UPDATE subscription_plans SET currency = ${currency}, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (interval !== undefined) {
      await sql`UPDATE subscription_plans SET interval = ${interval}, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (features !== undefined) {
      await sql`UPDATE subscription_plans SET features = ${JSON.stringify(features)}::jsonb, updated_at = NOW() WHERE id = ${params.id}`
    }
    if (is_active !== undefined) {
      await sql`UPDATE subscription_plans SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${params.id}`
    }

    // Obtener el plan actualizado
    const result = await sql`
      SELECT * FROM subscription_plans WHERE id = ${params.id}
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