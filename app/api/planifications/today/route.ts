import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// GET /api/planifications/today?date=YYYY-MM-DD
// Obtiene la planificación de una fecha específica (o hoy si no se proporciona) según las preferencias del usuario (discipline y level)
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
        data: null,
        message: 'El usuario no tiene preferencias configuradas (discipline y level)'
      })
    }

    const { preferred_discipline_id, preferred_level_id } = preferences[0]

    // Obtener la fecha del query param o usar hoy
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    
    let dateStr: string
    if (dateParam) {
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(dateParam)) {
        dateStr = dateParam
      } else {
        // Si el formato no es válido, usar hoy
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      }
    } else {
      // Usar hoy - formatear manualmente para evitar problemas de timezone
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    }
    
    // Buscar planificaciones activas para la fecha especificada que coincidan con la disciplina y nivel del usuario
    // Comparar directamente la fecha usando el formato YYYY-MM-DD
    const planifications = await sql`
      SELECT 
        p.*,
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'color', d.color,
          'icon', d.icon
        ) as discipline,
        jsonb_build_object(
          'id', dl.id,
          'name', dl.name,
          'description', dl.description
        ) as discipline_level
      FROM planifications p
      LEFT JOIN disciplines d ON p.discipline_id = d.id
      LEFT JOIN discipline_levels dl ON p.discipline_level_id = dl.id
      WHERE p.discipline_id = ${preferred_discipline_id}
        AND p.discipline_level_id = ${preferred_level_id}
        AND p.date::date = ${dateStr}::date
        AND p.is_active = true
      ORDER BY p.date ASC
      LIMIT 1
    `

    if (!planifications || planifications.length === 0) {
      return NextResponse.json({ 
        data: null,
        message: `No hay planificación para ${dateParam ? 'esa fecha' : 'hoy'} con tu disciplina y nivel`
      })
    }

    // Transformar los campos JSONB
    const planification = {
      ...planifications[0],
      discipline: typeof planifications[0].discipline === 'string' 
        ? JSON.parse(planifications[0].discipline) 
        : planifications[0].discipline,
      discipline_level: typeof planifications[0].discipline_level === 'string' 
        ? JSON.parse(planifications[0].discipline_level) 
        : planifications[0].discipline_level
    }

    return NextResponse.json({ data: planification })
  } catch (error) {
    console.error('Error fetching today planification:', error)
    return NextResponse.json(
      { error: 'Error al cargar la planificación de hoy' },
      { status: 500 }
    )
  }
}