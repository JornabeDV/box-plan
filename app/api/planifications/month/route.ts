import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/planifications/month?year=2024&month=1
// Obtiene todas las planificaciones del mes según las preferencias del usuario (discipline y level)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Obtener las preferencias del usuario
    const preferences = await sql`
      SELECT preferred_discipline_id, preferred_level_id
      FROM user_preferences
      WHERE user_id = ${userId}
    `

    if (!preferences || preferences.length === 0 || !preferences[0].preferred_discipline_id || !preferences[0].preferred_level_id) {
      return NextResponse.json({ 
        data: [],
        message: 'El usuario no tiene preferencias configuradas (discipline y level)'
      })
    }

    const { preferred_discipline_id, preferred_level_id } = preferences[0]

    // Obtener año y mes de los query params
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')
    
    const now = new Date()
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

    // Calcular el primer y último día del mes
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    const startDate = firstDay.toISOString().split('T')[0] // YYYY-MM-DD
    const endDate = lastDay.toISOString().split('T')[0] // YYYY-MM-DD

    // Buscar todas las planificaciones activas del mes que coincidan EXACTAMENTE con la disciplina y nivel del usuario
    // Comparar directamente usando el formato de fecha
    const planifications = await sql`
      SELECT 
        p.id,
        p.date,
        p.discipline_id,
        p.discipline_level_id,
        p.is_active
      FROM planifications p
      WHERE p.discipline_id = ${preferred_discipline_id}
        AND p.discipline_level_id = ${preferred_level_id}
        AND p.date::date >= ${startDate}::date
        AND p.date::date <= ${endDate}::date
        AND p.is_active = true
      ORDER BY p.date ASC
    `

    // Extraer solo las fechas (días del mes) que tienen planificación
    // Asegurarse de que la fecha pertenezca al mes correcto
    const datesWithPlanification = planifications
      .map((p: any) => {
        const date = new Date(p.date)
        // Verificar que la fecha pertenezca al mes y año correcto
        if (date.getFullYear() === year && date.getMonth() + 1 === month) {
          return date.getDate() // Retornar solo el día del mes (1-31)
        }
        return null
      })
      .filter((day: number | null) => day !== null) as number[]

    return NextResponse.json({ 
      data: datesWithPlanification,
      month,
      year
    })
  } catch (error) {
    console.error('Error fetching month planifications:', error)
    return NextResponse.json(
      { error: 'Error al cargar las planificaciones del mes' },
      { status: 500 }
    )
  }
}