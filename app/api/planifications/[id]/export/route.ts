import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/planifications/[id]/export
 * Exporta una planificación específica a formato Excel
 * Formato expandido: una fila por cada ejercicio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden exportar planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planificationId = parseInt(params.id, 10)

    if (isNaN(planificationId)) {
      return NextResponse.json({ error: 'ID de planificación inválido' }, { status: 400 })
    }

    // Obtener la planificación con sus relaciones
    const planification = await prisma.planification.findFirst({
      where: {
        id: planificationId,
        coachId: coachId
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        disciplineLevel: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!planification) {
      return NextResponse.json({ error: 'Planificación no encontrada' }, { status: 404 })
    }

    // Transformar exercises (JSON) a formato expandido
    const exercisesData = planification.exercises as Array<{
      id?: string
      title: string
      items: string[]
      order: number
      notes?: string
    }> || []

    // Crear filas expandidas (una por ejercicio)
    const rows: Array<{
      Fecha: string
      Disciplina: string
      Nivel: string
      Tipo: string
      Estudiante: string
      Bloque: string
      'Orden Bloque': number
      Ejercicio: string
      'Notas Bloque': string
      'Notas General': string
    }> = []

    // Normalizar fecha
    const dateObj = planification.date instanceof Date ? planification.date : new Date(planification.date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const normalizedDate = `${year}-${month}-${day}`

    const tipo = planification.isPersonalized ? 'Personalizada' : 'General'
    const estudiante = planification.targetUser?.name || ''

    // Si no hay ejercicios, crear al menos una fila vacía
    if (exercisesData.length === 0) {
      rows.push({
        Fecha: normalizedDate,
        Disciplina: planification.discipline?.name || '',
        Nivel: planification.disciplineLevel?.name || '',
        Tipo: tipo,
        Estudiante: estudiante,
        Bloque: '',
        'Orden Bloque': 0,
        Ejercicio: '',
        'Notas Bloque': '',
        'Notas General': planification.notes || ''
      })
    } else {
      // Expandir cada ejercicio en filas separadas
      for (const block of exercisesData) {
        // Si el bloque no tiene items, crear una fila vacía para el bloque
        if (!block.items || block.items.length === 0) {
          rows.push({
            Fecha: normalizedDate,
            Disciplina: planification.discipline?.name || '',
            Nivel: planification.disciplineLevel?.name || '',
            Tipo: tipo,
            Estudiante: estudiante,
            Bloque: block.title,
            'Orden Bloque': block.order,
            Ejercicio: '',
            'Notas Bloque': block.notes || '',
            'Notas General': planification.notes || ''
          })
        } else {
          // Una fila por cada ejercicio del bloque
          for (const item of block.items) {
            rows.push({
              Fecha: normalizedDate,
              Disciplina: planification.discipline?.name || '',
              Nivel: planification.disciplineLevel?.name || '',
              Tipo: tipo,
              Estudiante: estudiante,
              Bloque: block.title,
              'Orden Bloque': block.order,
              Ejercicio: item,
              'Notas Bloque': block.notes || '',
              'Notas General': planification.notes || ''
            })
          }
        }
      }
    }

    // Crear el workbook de Excel
    const worksheet = XLSX.utils.json_to_sheet(rows)
    
    // Ajustar anchos de columna
    const colWidths = [
      { wch: 12 },  // Fecha
      { wch: 20 },  // Disciplina
      { wch: 20 },  // Nivel
      { wch: 15 },  // Tipo
      { wch: 30 },  // Estudiante
      { wch: 25 },  // Bloque
      { wch: 15 },  // Orden Bloque
      { wch: 40 },  // Ejercicio
      { wch: 30 },  // Notas Bloque
      { wch: 30 },  // Notas General
    ]
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificación')

    // Generar el buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Crear nombre de archivo descriptivo
    const fileName = `planificacion_${normalizedDate}_${planification.discipline?.name || 'sin-disciplina'}.xlsx`

    // Retornar el archivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Error exporting planification:', error)
    return NextResponse.json(
      { error: 'Error al exportar la planificación' },
      { status: 500 }
    )
  }
}
