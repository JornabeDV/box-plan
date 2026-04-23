import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { normalizeUserId, isCoach } from '@/lib/auth-helpers'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/planifications/template
 * Genera y devuelve una plantilla Excel de ejemplo para importar planificaciones.
 * Incluye 5 días (lunes a viernes) con estructura completa de bloques, sub-bloques y ejercicios.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    const userId = normalizeUserId(session?.user?.id)
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es coach
    const authCheck = await isCoach(userId)
    if (!authCheck.isAuthorized || !authCheck.profile) {
      return NextResponse.json({ error: 'No autorizado. Solo coaches pueden descargar plantillas.' }, { status: 403 })
    }

    // Fechas de ejemplo: lunes a viernes de una semana fija
    const exampleDates = [
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24',
    ]

    // Datos de ejemplo para cada día (con timers en bloques y sub-bloques)
    const dayExamples = [
      {
        date: exampleDates[0],
        blocks: [
          {
            title: 'Calentamiento',
            order: 1,
            notes: 'Movilidad articular y activación muscular',
            timerMode: '',
            timerConfig: null,
            exercises: ['500m rowing ligero', '10 shoulder dislocates', '15 air squats'],
            subBlocks: []
          },
          {
            title: 'Fuerza',
            order: 2,
            notes: 'Enfocarse en la profundidad del squat',
            timerMode: 'emom',
            timerConfig: { totalRounds: '10' },
            exercises: [],
            subBlocks: [
              { subtitle: 'Back Squat', exercises: ['Back squat 5x5 @ 80% RM'], timerMode: '', timerConfig: null },
              { subtitle: 'Accesorio', exercises: ['RDL 3x8 @ 60kg', 'Plank 3x45 seg'], timerMode: '', timerConfig: null }
            ]
          }
        ],
        generalNotes: 'Semana 1 - Día 1: Enfocarse en técnica antes que en carga'
      },
      {
        date: exampleDates[1],
        blocks: [
          {
            title: 'Calentamiento',
            order: 1,
            notes: 'Preparar hombros y cadera',
            timerMode: '',
            timerConfig: null,
            exercises: ['400m run suave', '10 push-ups', '10 good mornings con PVC'],
            subBlocks: []
          },
          {
            title: 'Gimnástico',
            order: 2,
            notes: 'Progresiones según nivel',
            timerMode: '',
            timerConfig: null,
            exercises: ['Pull-ups 4x6-8 (o band assisted)', 'Dips 3x8-10 (o bench dips)'],
            subBlocks: [
              { subtitle: 'Core', exercises: ['Hollow hold 3x30 seg', 'Arch hold 3x30 seg'], timerMode: 'tabata', timerConfig: { workTime: '20', restTime: '10', totalRounds: '8' } }
            ]
          }
        ],
        generalNotes: 'Semana 1 - Día 2: Priorizar rango de movimiento completo'
      },
      {
        date: exampleDates[2],
        blocks: [
          {
            title: 'Calentamiento',
            order: 1,
            notes: 'Activar el sistema cardiovascular',
            timerMode: '',
            timerConfig: null,
            exercises: ['600m bike erg', '10 scap pull-ups', '10 cossack squats por lado'],
            subBlocks: []
          },
          {
            title: 'Potencia',
            order: 2,
            notes: 'Máxima explosividad en cada repetición',
            timerMode: '',
            timerConfig: null,
            exercises: ['Power clean 5x2 @ 70% RM', 'Box jump 4x5 (24/20 pulgadas)'],
            subBlocks: [
              { subtitle: 'Olympic', exercises: ['Hang snatch 4x2 @ 60% RM'], timerMode: '', timerConfig: null }
            ]
          }
        ],
        generalNotes: 'Semana 1 - Día 3: Descansar 2-3 min entre series de potencia'
      },
      {
        date: exampleDates[3],
        blocks: [
          {
            title: 'Calentamiento',
            order: 1,
            notes: 'Movilidad de tobillos y caderas',
            timerMode: '',
            timerConfig: null,
            exercises: ['5 min saltar la soga', '10 pasos lunges con rotación', '10 inchworms'],
            subBlocks: []
          },
          {
            title: 'WOD',
            order: 2,
            notes: 'Mantener un ritmo sostenible',
            timerMode: 'fortime',
            timerConfig: null,
            exercises: ['21-15-9: thrusters (43/30kg) + pull-ups', 'Time cap: 12 minutos'],
            subBlocks: [
              { subtitle: 'Cooldown', exercises: ['5 min caminata', 'Foam rolling 5 min'], timerMode: '', timerConfig: null }
            ]
          }
        ],
        generalNotes: 'Semana 1 - Día 4: Escalar pesos si es necesario para mantener intensidad'
      },
      {
        date: exampleDates[4],
        blocks: [
          {
            title: 'Calentamiento',
            order: 1,
            notes: 'Activación glútea y core',
            timerMode: '',
            timerConfig: null,
            exercises: ['300m run', '10 banded side steps por lado', '10 bird dogs por lado'],
            subBlocks: []
          },
          {
            title: 'Accesorio',
            order: 2,
            notes: 'Trabajo unilateral y estabilidad',
            timerMode: 'amrap',
            timerConfig: { amrapTime: '15', totalRounds: '1' },
            exercises: ['Bulgarian split squat 3x8 por pierna', 'Single-arm DB press 3x10 por brazo'],
            subBlocks: [
              { subtitle: 'Core & Stability', exercises: ['Pallof press 3x12 por lado', 'Dead bug 3x8 por lado'], timerMode: '', timerConfig: null }
            ]
          }
        ],
        generalNotes: 'Semana 1 - Día 5: Sesión de recuperación activa y accesorios'
      }
    ]

    // Construir las filas del Excel
    const rows: Record<string, string | number>[] = []

    for (const day of dayExamples) {
      for (const block of day.blocks) {
        // Filas de ejercicios del bloque principal
        if (block.exercises.length > 0) {
          for (let i = 0; i < block.exercises.length; i++) {
            rows.push({
              'Fecha': day.date,
              'Disciplina': 'CrossFit',
              'Nivel': 'Avanzado',
              'Tipo': 'General',
              'Estudiante': '',
              'Bloque': block.title,
              'Orden Bloque': block.order,
              'Sub-bloque': '',
              'Ejercicio': block.exercises[i],
              'Notas Bloque': i === 0 ? block.notes : '',
              'Notas General': i === 0 ? day.generalNotes : '',
              'Timer Modo': i === 0 ? (block as any).timerMode || '' : '',
              'Timer Trabajo': i === 0 ? (block as any).timerConfig?.workTime || '' : '',
              'Timer Descanso': i === 0 ? (block as any).timerConfig?.restTime || '' : '',
              'Timer Rondas': i === 0 ? (block as any).timerConfig?.totalRounds || '' : '',
              'Timer AMRAP': i === 0 ? (block as any).timerConfig?.amrapTime || '' : '',
              'Timer Sub-bloque Modo': '',
              'Timer Sub-bloque Trabajo': '',
              'Timer Sub-bloque Descanso': '',
              'Timer Sub-bloque Rondas': '',
              'Timer Sub-bloque AMRAP': ''
            })
          }
        }

        // Filas de sub-bloques
        for (const subBlock of block.subBlocks) {
          for (let i = 0; i < subBlock.exercises.length; i++) {
            rows.push({
              'Fecha': day.date,
              'Disciplina': 'CrossFit',
              'Nivel': 'Avanzado',
              'Tipo': 'General',
              'Estudiante': '',
              'Bloque': block.title,
              'Orden Bloque': block.order,
              'Sub-bloque': subBlock.subtitle,
              'Ejercicio': subBlock.exercises[i],
              'Notas Bloque': i === 0 ? block.notes : '',
              'Notas General': i === 0 ? day.generalNotes : '',
              'Timer Modo': i === 0 ? (block as any).timerMode || '' : '',
              'Timer Trabajo': i === 0 ? (block as any).timerConfig?.workTime || '' : '',
              'Timer Descanso': i === 0 ? (block as any).timerConfig?.restTime || '' : '',
              'Timer Rondas': i === 0 ? (block as any).timerConfig?.totalRounds || '' : '',
              'Timer AMRAP': i === 0 ? (block as any).timerConfig?.amrapTime || '' : '',
              'Timer Sub-bloque Modo': i === 0 ? (subBlock as any).timerMode || '' : '',
              'Timer Sub-bloque Trabajo': i === 0 ? (subBlock as any).timerConfig?.workTime || '' : '',
              'Timer Sub-bloque Descanso': i === 0 ? (subBlock as any).timerConfig?.restTime || '' : '',
              'Timer Sub-bloque Rondas': i === 0 ? (subBlock as any).timerConfig?.totalRounds || '' : '',
              'Timer Sub-bloque AMRAP': i === 0 ? (subBlock as any).timerConfig?.amrapTime || '' : ''
            })
          }
        }

        // Si el bloque no tiene ejercicios ni sub-bloques, agregar una fila vacía para preservar estructura
        if (block.exercises.length === 0 && block.subBlocks.length === 0) {
          rows.push({
            'Fecha': day.date,
            'Disciplina': 'CrossFit',
            'Nivel': 'Avanzado',
            'Tipo': 'General',
            'Estudiante': '',
            'Bloque': block.title,
            'Orden Bloque': block.order,
            'Sub-bloque': '',
            'Ejercicio': '',
            'Notas Bloque': block.notes,
            'Notas General': day.generalNotes,
            'Timer Modo': (block as any).timerMode || '',
            'Timer Trabajo': (block as any).timerConfig?.workTime || '',
            'Timer Descanso': (block as any).timerConfig?.restTime || '',
            'Timer Rondas': (block as any).timerConfig?.totalRounds || '',
            'Timer AMRAP': (block as any).timerConfig?.amrapTime || '',
            'Timer Sub-bloque Modo': '',
            'Timer Sub-bloque Trabajo': '',
            'Timer Sub-bloque Descanso': '',
            'Timer Sub-bloque Rondas': '',
            'Timer Sub-bloque AMRAP': ''
          })
        }
      }
    }

    // Crear workbook
    const workbook = XLSX.utils.book_new()

    // Hoja principal con los datos
    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Definir anchos de columna
    const colWidths = [
      { wch: 12 },  // Fecha
      { wch: 15 },  // Disciplina
      { wch: 12 },  // Nivel
      { wch: 12 },  // Tipo
      { wch: 18 },  // Estudiante
      { wch: 18 },  // Bloque
      { wch: 14 },  // Orden Bloque
      { wch: 15 },  // Sub-bloque
      { wch: 35 },  // Ejercicio
      { wch: 35 },  // Notas Bloque
      { wch: 45 },  // Notas General
      { wch: 15 },  // Timer Modo
      { wch: 15 },  // Timer Trabajo
      { wch: 15 },  // Timer Descanso
      { wch: 15 },  // Timer Rondas
      { wch: 15 },  // Timer AMRAP
      { wch: 20 },  // Timer Sub-bloque Modo
      { wch: 20 },  // Timer Sub-bloque Trabajo
      { wch: 20 },  // Timer Sub-bloque Descanso
      { wch: 20 },  // Timer Sub-bloque Rondas
      { wch: 20 },  // Timer Sub-bloque AMRAP
    ]
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificaciones')

    // Hoja de guía/instrucciones
    const guideRows = [
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': 'CÓMO USAR ESTA PLANTILLA' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. Columna Fecha: usa formato YYYY-MM-DD (ej: 2026-04-21). Puedes repetir la misma fecha para varias filas si son del mismo día.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '2. Columna Disciplina: debe coincidir EXACTAMENTE con el nombre de una disciplina que hayas creado.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '3. Columna Nivel: debe coincidir EXACTAMENTE con un nivel de esa disciplina.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '4. Columna Tipo: escribe "General" para toda la clase, o "Personalizada" para un estudiante específico.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '5. Columna Estudiante: solo obligatorio si Tipo = Personalizada. Usa el nombre del estudiante.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '6. Columna Bloque: título del bloque (ej: Calentamiento, Fuerza, WOD).' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '7. Columna Orden Bloque: número que define el orden (1, 2, 3...).' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '8. Columna Sub-bloque: opcional. Si un ejercicio pertenece a un sub-grupo dentro del bloque, indicalo acá.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '9. Columna Ejercicio: descripción de un ejercicio. Una fila = un ejercicio.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '10. Columna Notas Bloque: notas específicas de ese bloque. Se toma de la primera fila del bloque.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '11. Columna Notas General: notas del día completo. Se toma de la primera fila del día.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '12. Columnas Timer (opcionales): asignan un temporizador a cada bloque o sub-bloque.' },
      { 'INSTRUCCIONES': '    • Timer Modo: normal | fortime | tabata | amrap | emom | otm. Se lee desde la primera fila del bloque/sub-bloque.' },
      { 'INSTRUCCIONES': '    • Timer Trabajo: segundos de trabajo (ej: 30, 60, 180).' },
      { 'INSTRUCCIONES': '    • Timer Descanso: segundos de descanso entre intervalos/rondas.' },
      { 'INSTRUCCIONES': '    • Timer Rondas: cantidad total de rondas/sets (ej: 5, 10, 20).' },
      { 'INSTRUCCIONES': '    • Timer AMRAP: duración total en segundos para el modo AMRAP (ej: 600 = 10 min).' },
      { 'INSTRUCCIONES': '    • Timer Sub-bloque X: mismos campos pero aplicados al sub-bloque en vez del bloque padre.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': 'IMPORTACIÓN MÚLTIPLE (VARIOS DÍAS)' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': 'Puedes incluir tantos días como quieras en un solo archivo.' },
      { 'INSTRUCCIONES': 'Simplemente cambia la fecha en las filas correspondientes.' },
      { 'INSTRUCCIONES': 'El sistema agrupa automáticamente por fecha e importa cada día como una planificación independiente.' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': 'REGLAS IMPORTANTES' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '- Si importas un día que ya existe, se SOBREESCRIBE (se reemplaza completamente).' },
      { 'INSTRUCCIONES': '- Las columnas Fecha, Disciplina, Nivel, Tipo y Bloque son obligatorias.' },
      { 'INSTRUCCIONES': '- No modifiques los nombres de las columnas.' },
      { 'INSTRUCCIONES': '- Puedes borrar las filas de ejemplo y reemplazarlas con tus planificaciones.' },
    ]

    const guideWorksheet = XLSX.utils.json_to_sheet(guideRows, { skipHeader: true })
    guideWorksheet['!cols'] = [{ wch: 100 }]
    XLSX.utils.book_append_sheet(workbook, guideWorksheet, 'Guía de uso')

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Devolver como descarga
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="plantilla_planificaciones_boxplan.xlsx"',
      },
    })

  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar la plantilla' },
      { status: 500 }
    )
  }
}
