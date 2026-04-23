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
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    dateStr = `${year}-${month}-${day}`
  } else if (typeof value === 'number') {
    // Excel serial number
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dateStr = `${year}-${month}-${day}`
  } else {
    dateStr = String(value || '').trim()
  }

  // Validar formato de fecha
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    return null
  }
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

  // Determinar tipo de planificación
  const tipo = String(firstDataRow.Tipo || '').trim()
  const isPersonalized = tipo.toLowerCase() === 'personalizada'

  // Validar que si es personalizada, tenga estudiante (en el Excel o via targetStudentId desde la UI)
  const studentName = String(firstDataRow.Estudiante || '').trim()
  if (isPersonalized && !studentName && !targetStudentId) {
    return {
      success: false,
      message: 'Las planificaciones personalizadas requieren el nombre del estudiante en la columna "Estudiante"',
      error: 'Falta columna Estudiante',
    }
  }

  // Parsear y validar fecha
  let dateStr = parseExcelDate(firstDataRow.Fecha)
  if (!dateStr) {
    return {
      success: false,
      message: `Formato de fecha inválido: ${firstDataRow.Fecha}. Use YYYY-MM-DD`,
      error: 'Fecha inválida',
    }
  }

  // Si se envió una fecha destino válida Y hay una sola fecha en el archivo, usarla como override
  // Para importación masiva (múltiples fechas), se ignora targetDate
  if (targetDateParam) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (dateRegex.test(targetDateParam.trim())) {
      dateStr = targetDateParam.trim()
    }
  }

  let targetStudent: { id: number; email: string; name: string | null } | null = null

  // Si es personalizada, buscar y validar el estudiante
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
      // Buscar estudiante por ID (viene desde la UI)
      const relationship = await prisma.coachStudentRelationship.findFirst({
        where: {
          coachId: coachId,
          status: 'active',
          studentId: targetStudentId
        },
        include: {
          student: {
            select: { id: true, email: true, name: true }
          }
        }
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
      // Buscar estudiantes activos del coach que coincidan con el nombre del Excel
      const students = await prisma.coachStudentRelationship.findMany({
        where: {
          coachId: coachId,
          status: 'active',
          student: {
            name: { contains: studentName, mode: 'insensitive' }
          }
        },
        include: {
          student: {
            select: { id: true, email: true, name: true }
          }
        }
      })

      if (students.length === 0) {
        return {
          success: false,
          message: `No se encontró un estudiante activo con el nombre "${studentName}" asignado a tu cuenta`,
          error: 'Estudiante no encontrado',
        }
      }

      // Si hay múltiples coincidencias, buscar coincidencia exacta
      student = students.find(s =>
        s.student.name?.toLowerCase() === studentName.toLowerCase()
      )?.student ?? null

      // Si no hay coincidencia exacta, usar la primera
      if (!student && students.length > 0) {
        student = students[0].student
      }

      if (!student) {
        return {
          success: false,
          message: `No se pudo identificar al estudiante "${studentName}"`,
          error: 'Estudiante no identificado',
        }
      }
    }

    // Verificar que el estudiante tenga la feature personalizedWorkouts
    const studentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: student.id,
        status: 'active'
      },
      include: {
        plan: {
          select: { features: true }
        }
      }
    })

    const studentFeatures = studentSubscription?.plan?.features as { personalizedWorkouts?: boolean } | null
    if (!studentFeatures?.personalizedWorkouts) {
      return {
        success: false,
        message: `El estudiante "${student.name || student.email}" no tiene habilitadas las planificaciones personalizadas en su plan actual`,
        error: 'Estudiante sin plan personalizado',
      }
    }

    targetStudent = student
  }

  // Buscar disciplina por nombre
  const disciplineName = String(firstDataRow.Disciplina || '').trim()
  const discipline = await prisma.discipline.findFirst({
    where: {
      name: disciplineName,
      coachId: coachId
    }
  })

  if (!discipline) {
    return {
      success: false,
      message: `Disciplina "${disciplineName}" no encontrada. Asegúrate de que exista y pertenezca a tu cuenta.`,
      error: 'Disciplina no encontrada',
    }
  }

  // Buscar nivel por nombre y disciplina
  const levelName = String(firstDataRow.Nivel || '').trim()
  const disciplineLevel = await prisma.disciplineLevel.findFirst({
    where: {
      name: levelName,
      disciplineId: discipline.id
    }
  })

  if (!disciplineLevel) {
    return {
      success: false,
      message: `Nivel "${levelName}" no encontrado para la disciplina "${disciplineName}"`,
      error: 'Nivel no encontrado',
    }
  }

  // Agrupar filas por bloque para reconstruir la estructura con sub-bloques y timers
  const blocksMap = new Map<string, {
    title: string
    order: number
    items: string[]
    notes: string
    timerMode: string | null
    timerConfig: { workTime?: string; restTime?: string; totalRounds?: string; amrapTime?: string } | null
    subBlocksMap: Map<string, {
      subtitle: string
      items: string[]
      timerMode: string | null
      timerConfig: { workTime?: string; restTime?: string; totalRounds?: string; amrapTime?: string } | null
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
        subBlocksMap: new Map()
      })
    }

    const block = blocksMap.get(blockKey)!
    const exercise = String(row.Ejercicio || '').trim()
    const subBlockTitle = String(row['Sub-bloque'] || '').trim()

    // Actualizar notas si no hay todavía
    const rowNotes = String(row['Notas Bloque'] || '').trim()
    if (rowNotes && !block.notes) {
      block.notes = rowNotes
    }

    // Extraer timer del bloque principal (de la primera fila del bloque que tenga timer)
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
        // Limpiar valores vacíos
        Object.keys(block.timerConfig).forEach(key => {
          if (!(block.timerConfig as any)[key]) delete (block.timerConfig as any)[key]
        })
      }
    }

    if (!exercise) continue

    if (subBlockTitle) {
      // Ejercicio pertenece a un sub-bloque
      if (!block.subBlocksMap.has(subBlockTitle)) {
        block.subBlocksMap.set(subBlockTitle, {
          subtitle: subBlockTitle,
          items: [],
          timerMode: null,
          timerConfig: null
        })
      }
      const subBlock = block.subBlocksMap.get(subBlockTitle)!
      subBlock.items.push(exercise)

      // Extraer timer del sub-bloque (de la primera fila del sub-bloque que tenga timer)
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
          Object.keys(subBlock.timerConfig).forEach(key => {
            if (!(subBlock.timerConfig as any)[key]) delete (subBlock.timerConfig as any)[key]
          })
        }
      }
    } else {
      // Ejercicio del bloque principal
      block.items.push(exercise)
    }
  }

  // Convertir mapa a array ordenado, aplanando sub-bloques
  const blocks = Array.from(blocksMap.values())
    .sort((a, b) => a.order - b.order)
    .map(({ subBlocksMap, timerMode, timerConfig, ...block }) => {
      const result: any = {
        ...block,
        id: String(Date.now() + Math.random()),
        subBlocks: Array.from(subBlocksMap.values()).map(sub => {
          const subResult: any = {
            id: String(Date.now() + Math.random()),
            subtitle: sub.subtitle,
            items: sub.items
          }
          if (sub.timerMode) {
            subResult.timer_mode = sub.timerMode
            subResult.timer_config = sub.timerConfig
          }
          return subResult
        })
      }
      if (timerMode) {
        result.timer_mode = timerMode
        result.timer_config = timerConfig
      }
      return result
    })

  if (blocks.length === 0) {
    return {
      success: false,
      message: 'No se encontraron bloques válidos en el archivo',
      error: 'Sin bloques válidos',
    }
  }

  // Obtener notas generales (de la primera fila)
  const generalNotes = String(firstDataRow['Notas General'] || '').trim() || null

  // Normalizar fecha para la base de datos
  const normalizedDate = normalizeDateForArgentina(dateStr)

  let existingPlanification = null

  // Buscar planificación existente según el tipo
  if (isPersonalized) {
    existingPlanification = await prisma.planification.findFirst({
      where: {
        coachId: coachId,
        date: normalizedDate,
        targetUserId: targetStudent!.id,
        isPersonalized: true
      }
    })
  } else {
    existingPlanification = await prisma.planification.findFirst({
      where: {
        coachId: coachId,
        date: normalizedDate,
        disciplineId: discipline.id,
        disciplineLevelId: disciplineLevel.id,
        isPersonalized: false
      }
    })
  }

  let result: ImportResult

  if (existingPlanification) {
    // SOBREESCRIBIR la planificación existente
    const updated = await prisma.planification.update({
      where: { id: existingPlanification.id },
      data: {
        disciplineId: discipline.id,
        disciplineLevelId: disciplineLevel.id,
        exercises: blocks,
        notes: generalNotes,
        updatedAt: new Date()
      }
    })

    result = {
      success: true,
      message: `Planificación ${isPersonalized ? 'personalizada' : 'general'} actualizada correctamente`,
      planificationId: updated.id,
      date: dateStr,
      discipline: disciplineName,
      level: levelName,
      type: isPersonalized ? 'Personalizada' : 'General',
      student: isPersonalized ? (targetStudent!.name || targetStudent!.email) : undefined,
      blocksCount: blocks.length,
      exercisesCount: blocks.reduce((acc: number, b: { items: string[]; subBlocks: { items: string[] }[] }) =>
        acc + b.items.length + b.subBlocks.reduce((sacc, sb) => sacc + sb.items.length, 0), 0),
      action: 'updated'
    }
  } else {
    // CREAR nueva planificación
    const created = await prisma.planification.create({
      data: {
        coachId: coachId,
        disciplineId: discipline.id,
        disciplineLevelId: disciplineLevel.id,
        date: normalizedDate,
        title: null,
        description: null,
        exercises: blocks,
        notes: generalNotes,
        isCompleted: false,
        isPersonalized: isPersonalized,
        targetUserId: isPersonalized ? targetStudent!.id : null
      }
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
      exercisesCount: blocks.reduce((acc: number, b: { items: string[]; subBlocks: { items: string[] }[] }) =>
        acc + b.items.length + b.subBlocks.reduce((sacc, sb) => sacc + sb.items.length, 0), 0),
      action: 'created'
    }
  }

  return result
}

/**
 * POST /api/planifications/import
 * Importa planificaciones desde un archivo Excel.
 * 
 * Soporta:
 * - Un solo día (formato actual, compatible hacia atrás)
 * - Múltiples días (nuevo): agrupa filas por la columna Fecha y crea/actualiza
 *   una planificación por cada fecha encontrada.
 * 
 * Reglas:
 * - Soporta planificaciones Generales y Personalizadas
 * - Para Generales: sobrescribe si coincide fecha+disciplina+nivel
 * - Para Personalizadas: sobrescribe si coincide fecha+estudiante
 * - Valida que el estudiante exista, pertenezca al coach y tenga el feature activo
 * - Valida que el coach tenga permisos para crear planificaciones personalizadas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden importar planificaciones.' }, { status: 403 })
    }

    const coachId = authCheck.profile.id

    // Parsear el FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetDateParam = formData.get('targetDate') as string | null
    const targetStudentIdParam = formData.get('targetStudentId') as string | null
    const targetStudentId = targetStudentIdParam ? parseInt(targetStudentIdParam, 10) : null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'El archivo debe ser un Excel (.xlsx o .xls)' }, { status: 400 })
    }

    // Leer el archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parsear Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 })
    }

    // Validar columnas requeridas
    const firstRow = rows[0]
    const requiredColumns = ['Fecha', 'Disciplina', 'Nivel', 'Tipo', 'Bloque']
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`
      }, { status: 400 })
    }

    // Verificar si el coach puede crear planificaciones personalizadas
    // (lo cacheamos para no consultar en cada grupo)
    const canCreatePersonalized = await canCoachCreatePersonalizedPlanifications(coachId)

    // Agrupar filas por fecha
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
        error: `No se encontraron fechas válidas en el archivo. ${parseErrors.join('. ')}`
      }, { status: 400 })
    }

    // Determinar si es importación de un solo día o masiva
    const isBulkImport = rowsByDate.size > 1

    // Procesar cada grupo de fecha
    const results: ImportResult[] = []

    for (const [dateStr, dateRows] of rowsByDate) {
      try {
        const result = await processSinglePlanification(
          dateRows,
          coachId,
          isBulkImport ? null : targetDateParam, // targetDate solo aplica a importación de un solo día
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

    // Calcular resumen
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const created = successful.filter(r => r.action === 'created')
    const updated = successful.filter(r => r.action === 'updated')

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successful.length,
        failed: failed.length,
        created: created.length,
        updated: updated.length,
      }
    })

  } catch (error: any) {
    console.error('Error importing planification:', error)
    return NextResponse.json(
      { error: error.message || 'Error al importar la planificación' },
      { status: 500 }
    )
  }
}
