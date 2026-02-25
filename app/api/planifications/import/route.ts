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
  Ejercicio: string
  'Notas Bloque'?: string
  'Notas General'?: string
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

/**
 * POST /api/planifications/import
 * Importa una planificación desde un archivo Excel
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

    // Obtener datos de la primera fila (metadata común)
    const firstDataRow = rows[0]
    
    // Determinar tipo de planificación
    const tipo = String(firstDataRow.Tipo || '').trim()
    const isPersonalized = tipo.toLowerCase() === 'personalizada'

    // Validar que si es personalizada, tenga estudiante
    const studentName = String(firstDataRow.Estudiante || '').trim()
    if (isPersonalized && !studentName) {
      return NextResponse.json({ 
        error: 'Las planificaciones personalizadas requieren el nombre del estudiante en la columna "Estudiante"' 
      }, { status: 400 })
    }

    // Parsear y validar fecha
    let dateStr: string
    if (firstDataRow.Fecha instanceof Date) {
      const year = firstDataRow.Fecha.getFullYear()
      const month = String(firstDataRow.Fecha.getMonth() + 1).padStart(2, '0')
      const day = String(firstDataRow.Fecha.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    } else if (typeof firstDataRow.Fecha === 'number') {
      // Excel serial number
      const excelEpoch = new Date(1899, 11, 30)
      const date = new Date(excelEpoch.getTime() + firstDataRow.Fecha * 24 * 60 * 60 * 1000)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    } else {
      dateStr = String(firstDataRow.Fecha || '').trim()
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json({ 
        error: `Formato de fecha inválido: ${dateStr}. Use YYYY-MM-DD` 
      }, { status: 400 })
    }

    let targetStudent: { id: number; email: string; name: string | null } | null = null

    // Si es personalizada, buscar y validar el estudiante
    if (isPersonalized) {
      // Verificar que el coach pueda crear planificaciones personalizadas
      const canCreatePersonalized = await canCoachCreatePersonalizedPlanifications(coachId)
      if (!canCreatePersonalized) {
        return NextResponse.json({ 
          error: 'Tu plan no incluye planificaciones personalizadas. Actualiza tu plan para acceder a esta función.' 
        }, { status: 403 })
      }

      // Buscar estudiantes activos del coach que coincidan con el nombre
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
        return NextResponse.json({ 
          error: `No se encontró un estudiante activo con el nombre "${studentName}" asignado a tu cuenta` 
        }, { status: 400 })
      }

      // Si hay múltiples coincidencias, buscar coincidencia exacta
      let student = students.find(s => 
        s.student.name?.toLowerCase() === studentName.toLowerCase()
      )?.student

      // Si no hay coincidencia exacta, usar la primera
      if (!student && students.length > 0) {
        student = students[0].student
      }

      if (!student) {
        return NextResponse.json({ 
          error: `No se pudo identificar al estudiante "${studentName}"` 
        }, { status: 400 })
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
        return NextResponse.json({ 
          error: `El estudiante "${student.name || student.email}" no tiene habilitadas las planificaciones personalizadas en su plan actual` 
        }, { status: 403 })
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
      return NextResponse.json({ 
        error: `Disciplina "${disciplineName}" no encontrada. Asegúrate de que exista y pertenezca a tu cuenta.` 
      }, { status: 400 })
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
      return NextResponse.json({ 
        error: `Nivel "${levelName}" no encontrado para la disciplina "${disciplineName}"` 
      }, { status: 400 })
    }

    // Nota: El campo estimatedDuration no existe en el modelo actual
    // Se mantiene en el Excel para referencia pero no se guarda en BD

    // Agrupar filas por bloque para reconstruir la estructura
    const blocksMap = new Map<string, {
      title: string
      order: number
      items: string[]
      notes: string
    }>()

    for (const row of rows) {
      const blockTitle = String(row.Bloque || '').trim()
      if (!blockTitle) continue // Saltar filas sin bloque

      const orderNum = typeof row['Orden Bloque'] === 'string' 
        ? parseInt(row['Orden Bloque'], 10) || 0 
        : row['Orden Bloque'] || 0

      const blockKey = `${orderNum}-${blockTitle}`

      if (!blocksMap.has(blockKey)) {
        blocksMap.set(blockKey, {
          title: blockTitle,
          order: orderNum,
          items: [],
          notes: String(row['Notas Bloque'] || '').trim()
        })
      }

      const block = blocksMap.get(blockKey)!
      const exercise = String(row.Ejercicio || '').trim()
      
      if (exercise && !block.items.includes(exercise)) {
        block.items.push(exercise)
      }

      // Actualizar notas si hay nuevas
      const rowNotes = String(row['Notas Bloque'] || '').trim()
      if (rowNotes && !block.notes) {
        block.notes = rowNotes
      }
    }

    // Convertir mapa a array ordenado
    const blocks = Array.from(blocksMap.values()).sort((a, b) => a.order - b.order)

    if (blocks.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron bloques válidos en el archivo' 
      }, { status: 400 })
    }

    // Obtener notas generales (de la primera fila)
    const generalNotes = String(firstDataRow['Notas General'] || '').trim() || null

    // Normalizar fecha para la base de datos
    const normalizedDate = normalizeDateForArgentina(dateStr)

    let existingPlanification = null

    // Buscar planificación existente según el tipo
    if (isPersonalized) {
      // Para personalizadas: buscar por fecha + estudiante
      existingPlanification = await prisma.planification.findFirst({
        where: {
          coachId: coachId,
          date: normalizedDate,
          targetUserId: targetStudent!.id,
          isPersonalized: true
        }
      })
    } else {
      // Para generales: buscar por fecha + disciplina + nivel
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
        exercisesCount: blocks.reduce((acc: number, b: { items: string[] }) => acc + b.items.length, 0),
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
        exercisesCount: blocks.reduce((acc: number, b: { items: string[] }) => acc + b.items.length, 0),
        action: 'created'
      }
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error importing planification:', error)
    return NextResponse.json(
      { error: error.message || 'Error al importar la planificación' },
      { status: 500 }
    )
  }
}
