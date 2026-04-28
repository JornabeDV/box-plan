import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import { normalizeDateForArgentina } from '@/lib/utils'
import { canCoachCreatePersonalizedPlanifications } from '@/lib/coach-plan-features'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ExcelRow {
  Fecha: string | number | Date
  Disciplina: string
  Nivel: string
  Tipo: string
  Estudiante?: string
  Bloque: string
  'Orden Bloque': string | number
  'Sub-bloque'?: string
  Ejercicio: string
  'Notas Bloque'?: string
  'Notas General'?: string
  'Timer Modo'?: string
  'Timer Trabajo'?: string | number
  'Timer Descanso'?: string | number
  'Timer Rondas'?: string | number
  'Timer AMRAP'?: string | number
  'Timer Sub-bloque Modo'?: string
  'Timer Sub-bloque Trabajo'?: string | number
  'Timer Sub-bloque Descanso'?: string | number
  'Timer Sub-bloque Rondas'?: string | number
  'Timer Sub-bloque AMRAP'?: string | number
}

interface ImportResult {
  success: boolean
  message: string
  planificationId?: number
  date?: string
  discipline?: string
  level?: string
  type?: string
  student?: string
  blocksCount?: number
  exercisesCount?: number
  action?: 'created' | 'updated' | 'skipped'
  error?: string
}

function parseExcelDate(value: string | number | Date): string | null {
  let dateStr: string
  if (value instanceof Date) {
    dateStr = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  } else if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } else {
    dateStr = String(value || '').trim()
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return null
  return dateStr
}

async function processSinglePlanification(
  rows: ExcelRow[],
  coachId: number,
  targetDateParam: string | null,
  canCreatePersonalized: boolean,
  targetStudentId?: number | null
): Promise<ImportResult> {
  const firstDataRow = rows[0]

  const tipo = String(firstDataRow.Tipo || '').trim()
  const isPersonalized = tipo.toLowerCase() === 'personalizada'

  const studentName = String(firstDataRow.Estudiante || '').trim()
  if (isPersonalized && !studentName && !targetStudentId) {
    return {
      success: false,
      message: 'Las planificaciones personalizadas requieren el nombre del estudiante en la columna "Estudiante"',
      error: 'Falta columna Estudiante',
    }
  }

  let dateStr = parseExcelDate(firstDataRow.Fecha)
  if (!dateStr) {
    return {
      success: false,
      message: `Formato de fecha inválido: ${firstDataRow.Fecha}. Use YYYY-MM-DD`,
      error: 'Fecha inválida',
    }
  }

  if (targetDateParam) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(targetDateParam.trim())) {
      dateStr = targetDateParam.trim()
    }
  }

  let targetStudent: { id: number; email: string; name: string | null } | null = null

  if (isPersonalized) {
    if (!canCreatePersonalized) {
      return {
        success: false,
        message: 'Tu plan no incluye planificaciones personalizadas. Actualiza tu plan para acceder a esta función.',
        error: 'Sin permisos para personalizadas',
      }
    }

    let student: { id: number; email: string; name: string | null } | null = null

    if (targetStudentId) {
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: { coachId, status: 'active', studentId: targetStudentId },
        include: { student: { select: { id: true, email: true, name: true } } },
      })
      if (!relationship) {
        return {
          success: false,
          message: `No se encontró un estudiante activo con ID ${targetStudentId} asignado a tu cuenta`,
          error: 'Estudiante no encontrado',
        }
      }
      student = relationship.student ?? null
    } else {
      const students = await prisma.coachStudentRelationship.findMany({
        where: {
          coachId,
          status: 'active',
          student: { name: { contains: studentName, mode: 'insensitive' } },
        },
        include: { student: { select: { id: true, email: true, name: true } } },
      })

      if (students.length === 0) {
        return {
          success: false,
          message: `No se encontró un estudiante activo con el nombre "${studentName}" asignado a tu cuenta`,
          error: 'Estudiante no encontrado',
        }
      }

      student = students.find((s) => s.student.name?.toLowerCase() === studentName.toLowerCase())?.student ?? null
      if (!student && students.length > 0) {
        student = students[0].student
      }
    }

    const studentSubscription = await prisma.subscription.findFirst({
      where: { userId: student!.id, status: 'active' },
      include: { plan: { select: { features: true } } },
    })

    const studentFeatures = studentSubscription?.plan?.features as { personalizedWorkouts?: boolean } | null
    if (!studentFeatures?.personalizedWorkouts) {
      return {
        success: false,
        message: `El estudiante "${student!.name || student!.email}" no tiene habilitadas las planificaciones personalizadas en su plan actual`,
        error: 'Estudiante sin plan personalizado',
      }
    }

    targetStudent = student
  }

  const disciplineName = String(firstDataRow.Disciplina || '').trim()
  const discipline = await prisma.discipline.findFirst({
    where: { name: disciplineName, coachId },
  })

  if (!discipline) {
    return {
      success: false,
      message: `Disciplina "${disciplineName}" no encontrada. Asegúrate de que exista y pertenezca a tu cuenta.`,
      error: 'Disciplina no encontrada',
    }
  }

  const levelName = String(firstDataRow.Nivel || '').trim()
  const disciplineLevel = await prisma.disciplineLevel.findFirst({
    where: { name: levelName, disciplineId: discipline.id },
  })

  if (!disciplineLevel) {
    return {
      success: false,
      message: `Nivel "${levelName}" no encontrado para la disciplina "${disciplineName}"`,
      error: 'Nivel no encontrado',
    }
  }

  // Agrupar filas por bloque
  const blocksMap = new Map<string, {
    title: string
    order: number
    items: string[]
    notes: string
    timerMode: string | null
    timerConfig: any
    subBlocksMap: Map<string, {
      subtitle: string
      items: string[]
      timerMode: string | null
      timerConfig: any
    }>
  }>()

  for (const row of rows) {
    const blockTitle = String(row.Bloque || '').trim()
    if (!blockTitle) continue

    const orderNum = typeof row['Orden Bloque'] === 'string'
      ? parseInt(row['Orden Bloque'], 10) || 0
      : (row['Orden Bloque'] as number) || 0

    const blockKey = `${orderNum}-${blockTitle}`

    if (!blocksMap.has(blockKey)) {
      blocksMap.set(blockKey, {
        title: blockTitle,
        order: orderNum,
        items: [],
        notes: String(row['Notas Bloque'] || '').trim(),
        timerMode: null,
        timerConfig: null,
        subBlocksMap: new Map(),
      })
    }

    const block = blocksMap.get(blockKey)!
    const exercise = String(row.Ejercicio || '').trim()
    const subBlockTitle = String(row['Sub-bloque'] || '').trim()

    const rowNotes = String(row['Notas Bloque'] || '').trim()
    if (rowNotes && !block.notes) {
      block.notes = rowNotes
    }

    if (!block.timerMode) {
      const timerMode = String(row['Timer Modo'] || '').trim().toLowerCase()
      if (timerMode && ['normal', 'tabata', 'fortime', 'amrap', 'emom', 'otm'].includes(timerMode)) {
        block.timerMode = timerMode
        block.timerConfig = {
          workTime: String(row['Timer Trabajo'] || '').trim() || undefined,
          restTime: String(row['Timer Descanso'] || '').trim() || undefined,
          totalRounds: String(row['Timer Rondas'] || '').trim() || undefined,
          amrapTime: String(row['Timer AMRAP'] || '').trim() || undefined,
        }
        Object.keys(block.timerConfig).forEach((key) => {
          if (!(block.timerConfig as any)[key]) delete (block.timerConfig as any)[key]
        })
      }
    }

    if (!exercise) continue

    if (subBlockTitle) {
      if (!block.subBlocksMap.has(subBlockTitle)) {
        block.subBlocksMap.set(subBlockTitle, {
          subtitle: subBlockTitle,
          items: [],
          timerMode: null,
          timerConfig: null,
        })
      }
      const subBlock = block.subBlocksMap.get(subBlockTitle)!
      subBlock.items.push(exercise)

      if (!subBlock.timerMode) {
        const subTimerMode = String(row['Timer Sub-bloque Modo'] || '').trim().toLowerCase()
        if (subTimerMode && ['normal', 'tabata', 'fortime', 'amrap', 'emom', 'otm'].includes(subTimerMode)) {
          subBlock.timerMode = subTimerMode
          subBlock.timerConfig = {
            workTime: String(row['Timer Sub-bloque Trabajo'] || '').trim() || undefined,
            restTime: String(row['Timer Sub-bloque Descanso'] || '').trim() || undefined,
            totalRounds: String(row['Timer Sub-bloque Rondas'] || '').trim() || undefined,
            amrapTime: String(row['Timer Sub-bloque AMRAP'] || '').trim() || undefined,
          }
          Object.keys(subBlock.timerConfig).forEach((key) => {
            if (!(subBlock.timerConfig as any)[key]) delete (subBlock.timerConfig as any)[key]
          })
        }
      }
    } else {
      block.items.push(exercise)
    }
  }

  const blocks = Array.from(blocksMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ subBlocksMap, timerMode, timerConfig, ...block }) => {
      return {
        ...block,
        id: String(Date.now() + Math.random()),
        subBlocks: Array.from(subBlocksMap.values()).map((sub) => {
          return {
            id: String(Date.now() + Math.random()),
            subtitle: sub.subtitle,
            items: sub.items,
            timer_mode: sub.timerMode,
            timer_config: sub.timerConfig,
          }
        }),
        timer_mode: timerMode,
        timer_config: timerConfig,
      }
    })

  if (blocks.length === 0) {
    return {
      success: false,
      message: 'No se encontraron bloques válidos en el archivo',
      error: 'Sin bloques válidos',
    }
  }

  const generalNotes = String(firstDataRow['Notas General'] || '').trim() || null
  const normalizedDate = normalizeDateForArgentina(dateStr)

  let existingPlanification = null

  if (isPersonalized) {
    existingPlanification = await prisma.planification.findFirst({
      where: {
        coachId,
        date: normalizedDate,
        targetUserId: targetStudent!.id,
        isPersonalized: true,
      },
    })
  } else {
    existingPlanification = await prisma.planification.findFirst({
      where: {
        coachId,
        date: normalizedDate,
        disciplineId: discipline.id,
        disciplineLevelId: disciplineLevel.id,
        isPersonalized: false,
      },
    })
  }

  let result: ImportResult

  const exercisesCount = blocks.reduce(
    (acc: number, b: any) =>
      acc + b.items.length + (b.subBlocks || []).reduce((sacc: number, sb: any) => sacc + sb.items.length, 0),
    0
  )

  if (existingPlanification) {
    // Sobrescribir: eliminar bloques existentes y recrear
    await prisma.$transaction(async (tx) => {
      await tx.planificationBlock.deleteMany({
        where: { planificationId: existingPlanification!.id },
      })

      for (const block of blocks) {
        const createdBlock = await tx.planificationBlock.create({
          data: {
            planificationId: existingPlanification!.id,
            title: block.title || '',
            order: block.order ?? 0,
            notes: block.notes || null,
            timerMode: block.timer_mode || null,
            timerConfig: block.timer_config || null,
          },
        })

        for (let i = 0; i < block.items.length; i++) {
          await tx.planificationItem.create({
            data: {
              blockId: createdBlock.id,
              description: block.items[i],
              order: i,
            },
          })
        }

        for (const subBlock of block.subBlocks || []) {
          const createdSubBlock = await tx.planificationSubBlock.create({
            data: {
              blockId: createdBlock.id,
              subtitle: subBlock.subtitle || '',
              order: subBlock.order ?? 0,
              timerMode: subBlock.timer_mode || null,
              timerConfig: subBlock.timer_config || null,
            },
          })

          for (let i = 0; i < subBlock.items.length; i++) {
            await tx.planificationItem.create({
              data: {
                subBlockId: createdSubBlock.id,
                description: subBlock.items[i],
                order: i,
              },
            })
          }
        }
      }

      await tx.planification.update({
        where: { id: existingPlanification!.id },
        data: {
          disciplineId: discipline.id,
          disciplineLevelId: disciplineLevel.id,
          notes: generalNotes,
          updatedAt: new Date(),
        },
      })
    })

    result = {
      success: true,
      message: `Planificación ${isPersonalized ? 'personalizada' : 'general'} actualizada correctamente`,
      planificationId: existingPlanification.id,
      date: dateStr,
      discipline: disciplineName,
      level: levelName,
      type: isPersonalized ? 'Personalizada' : 'General',
      student: isPersonalized ? (targetStudent!.name || targetStudent!.email) : undefined,
      blocksCount: blocks.length,
      exercisesCount,
      action: 'updated',
    }
  } else {
    // Crear nueva planificación con estructura relacional
    const created = await prisma.$transaction(async (tx) => {
      const planification = await tx.planification.create({
        data: {
          coachId,
          disciplineId: discipline.id,
          disciplineLevelId: disciplineLevel.id,
          date: normalizedDate,
          title: null,
          description: null,
          notes: generalNotes,
          isCompleted: false,
          isPersonalized: isPersonalized,
          targetUserId: isPersonalized ? targetStudent!.id : null,
        },
      })

      for (const block of blocks) {
        const createdBlock = await tx.planificationBlock.create({
          data: {
            planificationId: planification.id,
            title: block.title || '',
            order: block.order ?? 0,
            notes: block.notes || null,
            timerMode: block.timer_mode || null,
            timerConfig: block.timer_config || null,
          },
        })

        for (let i = 0; i < block.items.length; i++) {
          await tx.planificationItem.create({
            data: {
              blockId: createdBlock.id,
              description: block.items[i],
              order: i,
            },
          })
        }

        for (const subBlock of block.subBlocks || []) {
          const createdSubBlock = await tx.planificationSubBlock.create({
            data: {
              blockId: createdBlock.id,
              subtitle: subBlock.subtitle || '',
              order: subBlock.order ?? 0,
              timerMode: subBlock.timer_mode || null,
              timerConfig: subBlock.timer_config || null,
            },
          })

          for (let i = 0; i < subBlock.items.length; i++) {
            await tx.planificationItem.create({
              data: {
                subBlockId: createdSubBlock.id,
                description: subBlock.items[i],
                order: i,
              },
            })
          }
        }
      }

      return planification
    })

    result = {
      success: true,
      message: `Planificación ${isPersonalized ? 'personalizada' : 'general'} creada correctamente`,
      planificationId: created.id,
      date: dateStr,
      discipline: disciplineName,
      level: levelName,
      type: isPersonalized ? 'Personalizada' : 'General',
      student: isPersonalized ? (targetStudent!.name || targetStudent!.email) : undefined,
      blocksCount: blocks.length,
      exercisesCount,
      action: 'created',
    }
  }

  return result
}

// POST /api/planifications/import
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden importar planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetDateParam = formData.get('targetDate') as string | null
    const targetStudentIdParam = formData.get('targetStudentId') as string | null
    const targetStudentId = targetStudentIdParam ? parseInt(targetStudentIdParam, 10) : null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'El archivo debe ser un Excel (.xlsx o .xls)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 })
    }

    const firstRow = rows[0]
    const requiredColumns = ['Fecha', 'Disciplina', 'Nivel', 'Tipo', 'Bloque']
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`,
      }, { status: 400 })
    }

    const canCreatePersonalized = await canCoachCreatePersonalizedPlanifications(coachId)

    const rowsByDate = new Map<string, ExcelRow[]>()
    const parseErrors: string[] = []

    for (const row of rows) {
      const dateStr = parseExcelDate(row.Fecha)
      if (!dateStr) {
        parseErrors.push(`Fila con fecha inválida: ${row.Fecha}`)
        continue
      }
      if (!rowsByDate.has(dateStr)) {
        rowsByDate.set(dateStr, [])
      }
      rowsByDate.get(dateStr)!.push(row)
    }

    if (rowsByDate.size === 0) {
      return NextResponse.json({
        error: `No se encontraron fechas válidas en el archivo. ${parseErrors.join('. ')}`,
      }, { status: 400 })
    }

    const isBulkImport = rowsByDate.size > 1

    const results: ImportResult[] = []

    for (const [dateStr, dateRows] of rowsByDate) {
      try {
        const result = await processSinglePlanification(
          dateRows,
          coachId,
          isBulkImport ? null : targetDateParam,
          canCreatePersonalized,
          targetStudentId
        )
        results.push(result)
      } catch (error: any) {
        results.push({
          success: false,
          message: error.message || 'Error al procesar la planificación',
          date: dateStr,
          error: error.message || 'Error inesperado',
        })
      }
    }

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)
    const created = successful.filter((r) => r.action === 'created')
    const updated = successful.filter((r) => r.action === 'updated')

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successful.length,
        failed: failed.length,
        created: created.length,
        updated: updated.length,
      },
    })
  } catch (error: any) {
    console.error('Error importing planification:', error)
    return NextResponse.json(
      { error: error.message || 'Error al importar la planificación' },
      { status: 500 }
    )
  }
}
