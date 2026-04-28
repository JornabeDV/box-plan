import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden exportar planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id
    const planificationId = parseInt(params.id, 10)

    if (isNaN(planificationId)) {
      return NextResponse.json({ error: 'ID de planificación inválido' }, { status: 400 })
    }

    const planification = await prisma.planification.findFirst({
      where: { id: planificationId, coachId },
      include: {
        discipline: { select: { id: true, name: true, color: true } },
        disciplineLevel: { select: { id: true, name: true, description: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' }, include: { exercise: true } },
            subBlocks: {
              orderBy: { order: 'asc' },
              include: {
                items: { orderBy: { order: 'asc' }, include: { exercise: true } },
              },
            },
          },
        },
      },
    })

    if (!planification) {
      return NextResponse.json({ error: 'Planificación no encontrada' }, { status: 404 })
    }

    const dateObj = planification.date instanceof Date ? planification.date : new Date(planification.date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const normalizedDate = `${year}-${month}-${day}`

    const tipo = planification.isPersonalized ? 'Personalizada' : 'General'
    const estudiante = planification.targetUser?.name || ''

    const baseRow = {
      Fecha: normalizedDate,
      Disciplina: planification.discipline?.name || '',
      Nivel: planification.disciplineLevel?.name || '',
      Tipo: tipo,
      Estudiante: estudiante,
    }

    const rows: any[] = []

    const addItemRows = (
      blockTitle: string,
      blockOrder: number,
      blockNotes: string,
      blockTimerMode: string,
      blockTimerConfig: any,
      subBlockTitle: string,
      subBlockTimerMode: string,
      subBlockTimerConfig: any,
      items: any[]
    ) => {
      const timerCols = {
        'Timer Modo': blockTimerMode,
        'Timer Trabajo': blockTimerConfig?.workTime || '',
        'Timer Descanso': blockTimerConfig?.restTime || '',
        'Timer Rondas': blockTimerConfig?.totalRounds || '',
        'Timer AMRAP': blockTimerConfig?.amrapTime || '',
        'Timer Sub-bloque Modo': subBlockTimerMode,
        'Timer Sub-bloque Trabajo': subBlockTimerConfig?.workTime || '',
        'Timer Sub-bloque Descanso': subBlockTimerConfig?.restTime || '',
        'Timer Sub-bloque Rondas': subBlockTimerConfig?.totalRounds || '',
        'Timer Sub-bloque AMRAP': subBlockTimerConfig?.amrapTime || '',
      }
      if (items.length === 0) {
        rows.push({
          ...baseRow,
          ...timerCols,
          Bloque: blockTitle,
          'Orden Bloque': blockOrder,
          'Sub-bloque': subBlockTitle,
          Ejercicio: '',
          'Notas Bloque': blockNotes,
          'Notas General': planification.notes || '',
        })
      } else {
        for (const item of items) {
          const exerciseName = item.exercise?.name
            ? `${item.description} (${item.exercise.name})`
            : item.description
          rows.push({
            ...baseRow,
            ...timerCols,
            Bloque: blockTitle,
            'Orden Bloque': blockOrder,
            'Sub-bloque': subBlockTitle,
            Ejercicio: exerciseName,
            'Notas Bloque': blockNotes,
            'Notas General': planification.notes || '',
          })
        }
      }
    }

    const blocks = planification.blocks || []
    if (blocks.length === 0) {
      rows.push({
        ...baseRow,
        Bloque: '',
        'Orden Bloque': 0,
        'Sub-bloque': '',
        Ejercicio: '',
        'Notas Bloque': '',
        'Notas General': planification.notes || '',
        'Timer Modo': '',
        'Timer Trabajo': '',
        'Timer Descanso': '',
        'Timer Rondas': '',
        'Timer AMRAP': '',
        'Timer Sub-bloque Modo': '',
        'Timer Sub-bloque Trabajo': '',
        'Timer Sub-bloque Descanso': '',
        'Timer Sub-bloque Rondas': '',
        'Timer Sub-bloque AMRAP': '',
      })
    } else {
      for (const block of blocks) {
        const blockNotes = block.notes || ''
        const blockTimerMode = block.timerMode || ''
        const blockTimerConfig = block.timerConfig

        addItemRows(
          block.title,
          block.order,
          blockNotes,
          blockTimerMode,
          blockTimerConfig,
          '',
          '',
          undefined,
          block.items || []
        )

        if (block.subBlocks && block.subBlocks.length > 0) {
          for (const sub of block.subBlocks) {
            addItemRows(
              block.title,
              block.order,
              blockNotes,
              blockTimerMode,
              blockTimerConfig,
              sub.subtitle || '',
              sub.timerMode || '',
              sub.timerConfig,
              sub.items || []
            )
          }
        }
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows)

    const colWidths = [
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
      { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 30 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    ]
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificación')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const fileName = `planificacion_${normalizedDate}_${planification.discipline?.name || 'sin-disciplina'}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting planification:', error)
    return NextResponse.json(
      { error: 'Error al exportar la planificación' },
      { status: 500 }
    )
  }
}
