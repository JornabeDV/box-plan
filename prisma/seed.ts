import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Test1234!'

async function hash(password: string) {
  return bcrypt.hash(password, 10)
}

async function createCoachPlanTypes() {
  const start = await prisma.coachPlanType.upsert({
    where: { slug: 'start' },
    update: {},
    create: {
      slug: 'start',
      name: 'START',
      displayName: 'Plan Start',
      minStudents: 1,
      maxStudents: 25,
      basePrice: 15000.0,
      commissionRate: 12.0,
      maxStudentPlans: 2,
      maxStudentPlanTier: 'basic',
      features: {
        planification_access: 'weekly',
        max_disciplines: 2,
        timer: true,
        score_loading: false,
        score_database: false,
        mercadopago_connection: false,
        whatsapp_integration: false,
        community_forum: false,
        custom_motivational_quotes: false,
        personalized_planifications: false,
        replicate_planifications: false,
      },
    },
  })

  const power = await prisma.coachPlanType.upsert({
    where: { slug: 'power' },
    update: {},
    create: {
      slug: 'power',
      name: 'POWER',
      displayName: 'Plan Power',
      minStudents: 1,
      maxStudents: 100,
      basePrice: 35000.0,
      commissionRate: 12.0,
      maxStudentPlans: 4,
      maxStudentPlanTier: 'premium',
      features: {
        planification_access: 'monthly',
        max_disciplines: 3,
        timer: true,
        score_loading: true,
        score_database: true,
        mercadopago_connection: true,
        whatsapp_integration: true,
        community_forum: true,
        custom_motivational_quotes: true,
        personalized_planifications: true,
        replicate_planifications: true,
      },
    },
  })

  const elite = await prisma.coachPlanType.upsert({
    where: { slug: 'elite' },
    update: {},
    create: {
      slug: 'elite',
      name: 'ELITE',
      displayName: 'Plan Elite',
      minStudents: 1,
      maxStudents: 999999,
      basePrice: 65000.0,
      commissionRate: 12.0,
      maxStudentPlans: 10,
      maxStudentPlanTier: 'vip',
      features: {
        planification_access: 'unlimited',
        max_disciplines: 999999,
        timer: true,
        score_loading: true,
        score_database: true,
        mercadopago_connection: true,
        whatsapp_integration: true,
        community_forum: true,
        custom_motivational_quotes: true,
        personalized_planifications: true,
        replicate_planifications: true,
      },
    },
  })

  return { start, power, elite }
}

async function createUser(
  email: string,
  name: string,
  role: 'admin' | 'coach' | 'student' | 'user',
  withCoachProfile = false
) {
  const data: any = {
    email,
    password: await hash(DEFAULT_PASSWORD),
    name,
    roles: {
      create: { role },
    },
  }

  if (role === 'admin') {
    data.adminProfile = { create: {} }
  }

  if (withCoachProfile) {
    data.coachProfile = {
      create: {
        businessName: `${name} Box`,
        phone: '+5491112345678',
        address: 'Av. Siempreviva 742',
        maxStudents: 100,
        commissionRate: 12.0,
        platformCommissionRate: 12.0,
      },
    }
  }

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: data,
    include: {
      roles: true,
      coachProfile: true,
      adminProfile: true,
    },
  })
}

async function createDisciplines(coachProfileId: number) {
  const crossfit = await prisma.discipline.create({
    data: {
      name: 'CrossFit',
      description: 'Entrenamiento funcional constantemente variado',
      color: '#EF4444',
      coachId: coachProfileId,
      orderIndex: 0,
      levels: {
        create: [
          { name: 'Principiante', description: 'Iniciación al CrossFit', orderIndex: 0 },
          { name: 'Intermedio', description: 'Base sólida de movimientos', orderIndex: 1 },
          { name: 'Avanzado', description: 'Alto rendimiento', orderIndex: 2 },
          { name: 'RX', description: 'Pesos y movimientos prescritos', orderIndex: 3 },
        ],
      },
    },
    include: { levels: true },
  })

  const halterofilia = await prisma.discipline.create({
    data: {
      name: 'Halterofilia',
      description: 'Levantamiento de pesas olímpico',
      color: '#3B82F6',
      coachId: coachProfileId,
      orderIndex: 1,
      levels: {
        create: [
          { name: 'Técnica', description: 'Dominio de la técnica', orderIndex: 0 },
          { name: 'Fuerza', description: 'Desarrollo de fuerza', orderIndex: 1 },
          { name: 'Competición', description: 'Preparación competición', orderIndex: 2 },
        ],
      },
    },
    include: { levels: true },
  })

  const gimnasticos = await prisma.discipline.create({
    data: {
      name: 'Gimnásticos',
      description: 'Movimientos gimnásticos en calistenia',
      color: '#10B981',
      coachId: coachProfileId,
      orderIndex: 2,
      levels: {
        create: [
          { name: 'Básico', description: 'Dominio corporal básico', orderIndex: 0 },
          { name: 'Intermedio', description: 'Habilidades dinámicas', orderIndex: 1 },
          { name: 'Avanzado', description: 'Habilidades complejas', orderIndex: 2 },
        ],
      },
    },
    include: { levels: true },
  })

  return [crossfit, halterofilia, gimnasticos]
}

async function createExercises(coachProfileId: number) {
  const exerciseData = [
    { name: 'Air Squat', category: 'Fuerza' },
    { name: 'Front Squat', category: 'Fuerza' },
    { name: 'Back Squat', category: 'Fuerza' },
    { name: 'Overhead Squat', category: 'Fuerza' },
    { name: 'Deadlift', category: 'Fuerza' },
    { name: 'Clean', category: 'Halterofilia' },
    { name: 'Clean & Jerk', category: 'Halterofilia' },
    { name: 'Snatch', category: 'Halterofilia' },
    { name: 'Push Press', category: 'Halterofilia' },
    { name: 'Push Jerk', category: 'Halterofilia' },
    { name: 'Thruster', category: 'Halterofilia' },
    { name: 'Wall Ball', category: 'Fuerza' },
    { name: 'Pull-up', category: 'Gimnásticos' },
    { name: 'Chest-to-bar', category: 'Gimnásticos' },
    { name: 'Bar Muscle-up', category: 'Gimnásticos' },
    { name: 'Ring Muscle-up', category: 'Gimnásticos' },
    { name: 'Toes-to-bar', category: 'Gimnásticos' },
    { name: 'Handstand Push-up', category: 'Gimnásticos' },
    { name: 'Burpee', category: 'Cardio' },
    { name: 'Double Under', category: 'Cardio' },
    { name: 'Box Jump', category: 'Cardio' },
    { name: 'Row', category: 'Cardio' },
    { name: 'Assault Bike', category: 'Cardio' },
    { name: 'Run', category: 'Cardio' },
  ]

  const exercises: { id: number; name: string; category: string | null }[] = []
  for (const ex of exerciseData) {
    const created = await prisma.exercise.create({
      data: {
        coachId: coachProfileId,
        name: ex.name,
        category: ex.category,
        description: `Ejercicio de ${ex.category}: ${ex.name}`,
        isActive: true,
      },
    })
    exercises.push(created)
  }
  return exercises
}

async function createStudentPlans(coachProfileId: number) {
  const basic = await prisma.subscriptionPlan.create({
    data: {
      name: 'Básico',
      description: 'Acceso semanal a planificaciones y timer',
      price: 15000.0,
      currency: 'ARS',
      interval: 'month',
      tier: 'basic',
      planificationAccess: 'weekly',
      planType: 'student',
      isCoachPlan: true,
      coachId: coachProfileId,
      features: {
        whatsappSupport: false,
        communityAccess: false,
        progressTracking: true,
        leaderboardAccess: false,
        timerAccess: true,
        personalizedWorkouts: false,
      },
    },
  })

  const premium = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium',
      description: 'Acceso mensual, ranking y seguimiento completo',
      price: 28000.0,
      currency: 'ARS',
      interval: 'month',
      tier: 'premium',
      planificationAccess: 'monthly',
      planType: 'student',
      isCoachPlan: true,
      coachId: coachProfileId,
      features: {
        whatsappSupport: true,
        communityAccess: true,
        progressTracking: true,
        leaderboardAccess: true,
        timerAccess: true,
        personalizedWorkouts: true,
      },
    },
  })

  const personalized = await prisma.subscriptionPlan.create({
    data: {
      name: 'Personalizado Elite',
      description: 'Plan a medida con seguimiento exclusivo del coach',
      price: 50000.0,
      currency: 'ARS',
      interval: 'month',
      tier: 'vip',
      planificationAccess: 'unlimited',
      planType: 'student',
      isCoachPlan: true,
      isPersonalized: true,
      shareToken: nanoid(24),
      coachId: coachProfileId,
      features: {
        whatsappSupport: true,
        communityAccess: true,
        progressTracking: true,
        leaderboardAccess: true,
        timerAccess: true,
        personalizedWorkouts: true,
      },
    },
  })

  return [basic, premium, personalized]
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

async function createPlanifications(
  coachProfileId: number,
  disciplines: Awaited<ReturnType<typeof createDisciplines>>,
  exercises: Awaited<ReturnType<typeof createExercises>>,
  students: Awaited<ReturnType<typeof createUser>>[]
) {
  const crossfit = disciplines[0]
  const intermedio = crossfit.levels.find((l) => l.name === 'Intermedio')!
  const avanzado = crossfit.levels.find((l) => l.name === 'Avanzado')!

  const today = startOfDay(new Date())
  const dates = [addDays(today, -2), addDays(today, -1), today, addDays(today, 1), addDays(today, 2)]

  const findEx = (name: string) => exercises.find((e) => e.name === name)!

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    const isPersonalized = i === 2 // planificación del día personalizada para student1
    const isPast = date < today

    const planification = await prisma.planification.create({
      data: {
        coachId: coachProfileId,
        disciplineId: crossfit.id,
        disciplineLevelId: i % 2 === 0 ? intermedio.id : avanzado.id,
        date,
        title: `WOD ${date.toLocaleDateString('es-AR')}`,
        description: `Planificación de CrossFit para el día ${date.toLocaleDateString('es-AR')}`,
        notes: 'Recuerden calentar bien antes de comenzar. Hidratación constante.',
        isCompleted: isPast,
        isPersonalized,
        targetUserId: isPersonalized ? students[0].id : null,
      },
    })

    // Bloque 1: Calentamiento
    await prisma.planificationBlock.create({
      data: {
        planificationId: planification.id,
        title: 'Calentamiento',
        order: 0,
        notes: 'Movilidad y activación',
        items: {
          create: [
            { description: '2 min row suave', order: 0 },
            { description: '10 air squats', order: 1 },
            { description: '10 push-ups', order: 2 },
            { description: '30 seg plank', order: 3 },
          ],
        },
      },
    })

    // Bloque 2: Fuerza
    const strengthBlock = await prisma.planificationBlock.create({
      data: {
        planificationId: planification.id,
        title: 'Fuerza',
        order: 1,
        notes: 'Trabajo de sentadilla',
        rounds: 5,
        scoreConfig: { metric: 'weight', includeInRanking: true, label: 'Peso máximo', unit: 'kg' },
        items: {
          create: [
            {
              exerciseId: findEx('Back Squat').id,
              description: '5 repeticiones al 75% RM',
              order: 0,
            },
          ],
        },
      },
    })

    // Bloque 3: WOD
    const wodBlock = await prisma.planificationBlock.create({
      data: {
        planificationId: planification.id,
        title: 'WOD',
        order: 2,
        notes: 'AMRAP 12 minutos',
        timerMode: 'amrap',
        timerConfig: { workTime: '0', restTime: '0', totalRounds: '1', amrapTime: '12' },
        scoreConfig: { metric: 'rounds_reps', includeInRanking: true, label: 'Rondas+Reps' },
        items: {
          create: [
            { exerciseId: findEx('Thruster').id, description: '9 repeticiones (40/30 kg)', order: 0 },
            { exerciseId: findEx('Chest-to-bar').id, description: '7 repeticiones', order: 1 },
            { exerciseId: findEx('Burpee').id, description: '5 repeticiones', order: 2 },
          ],
        },
      },
    })

    // Bloque 4: Accesorio con sub-bloques
    const accessoryBlock = await prisma.planificationBlock.create({
      data: {
        planificationId: planification.id,
        title: 'Accesorio',
        order: 3,
        notes: '3 rondas de core',
        rounds: 3,
      },
    })

    const coreSubBlock = await prisma.planificationSubBlock.create({
      data: {
        blockId: accessoryBlock.id,
        subtitle: 'Core',
        order: 0,
        items: {
          create: [
            { description: '15 sit-ups', order: 0 },
            { description: '20 russian twists', order: 1 },
            { description: '30 seg hollow hold', order: 2 },
          ],
        },
      },
    })

    // Planificación del día siguiente con otro formato
    if (i === 3) {
      await prisma.planificationBlock.create({
        data: {
          planificationId: planification.id,
          title: 'Halterofilia',
          order: 1,
          notes: 'Trabajo técnico de Snatch',
          items: {
            create: [
              { exerciseId: findEx('Snatch').id, description: '3 reps power snatch', order: 0 },
              { exerciseId: findEx('Overhead Squat').id, description: '3 reps OHS', order: 1 },
            ],
          },
        },
      })
    }

    // Si es pasada, crear algunos workouts para los primeros 2 estudiantes
    if (isPast) {
      for (const student of students.slice(0, 2)) {
        const workout = await prisma.workout.create({
          data: {
            userId: student.id,
            planificationId: planification.id,
            durationSeconds: 12 * 60 + Math.floor(Math.random() * 120),
            completedAt: new Date(date.getTime() + 18 * 60 * 60 * 1000),
          },
        })

        await prisma.workoutBlockResult.create({
          data: {
            workoutId: workout.id,
            planificationBlockId: wodBlock.id,
            metric: 'rounds_reps',
            value: { rounds: Math.floor(Math.random() * 6) + 3, reps: Math.floor(Math.random() * 20) },
            completedAt: workout.completedAt,
          },
        })

        await prisma.workoutBlockResult.create({
          data: {
            workoutId: workout.id,
            planificationBlockId: strengthBlock.id,
            metric: 'weight',
            value: { weight: Math.floor(Math.random() * 40) + 60 },
            completedAt: workout.completedAt,
          },
        })
      }
    }
  }
}

async function createRMRecords(students: Awaited<ReturnType<typeof createUser>>[]) {
  const records = [
    { exercise: 'Back Squat', weight: 100 },
    { exercise: 'Deadlift', weight: 140 },
    { exercise: 'Clean & Jerk', weight: 80 },
    { exercise: 'Snatch', weight: 65 },
    { exercise: 'Thruster', weight: 70 },
  ]

  for (const student of students) {
    for (const record of records) {
      await prisma.rMRecord.create({
        data: {
          userId: student.id,
          exercise: record.exercise,
          weight: record.weight + Math.floor(Math.random() * 20) - 10,
          recordedAt: addDays(new Date(), -Math.floor(Math.random() * 60)),
        },
      })
    }
  }
}

async function createWorkouts(students: Awaited<ReturnType<typeof createUser>>[]) {
  // Workouts sueltos (sin planificación asociada)
  for (const student of students) {
    await prisma.workout.create({
      data: {
        userId: student.id,
        data: { notes: 'Entrenamiento libre en casa' },
        durationSeconds: 30 * 60,
        completedAt: addDays(new Date(), -Math.floor(Math.random() * 14)),
      },
    })
  }
}

async function createAthleteNotes(
  coachProfileId: number,
  students: Awaited<ReturnType<typeof createUser>>[]
) {
  const planifications = await prisma.planification.findMany({
    where: { coachId: coachProfileId },
    take: 5,
    orderBy: { date: 'desc' },
  })

  const notes = [
    'Me sentí muy bien durante el WOD, aumentaré peso la próxima semana.',
    'El hombro derecho molestó en los push presses. Necesito movilidad.',
    'Buena sensación general. Dormí 8 horas.',
    'El AMRAP fue intenso, llegué a 5 rondas.',
    'Día de descanso activo, solo caminata.',
  ]

  for (let i = 0; i < Math.min(planifications.length, students.length); i++) {
    await prisma.planificationAthleteNote.create({
      data: {
        planificationId: planifications[i].id,
        userId: students[i].id,
        note: notes[i % notes.length],
      },
    })
  }
}

async function createMotivationalQuotes(coachProfileId: number) {
  const quotes = [
    'El único entrenamiento malo es el que no haces.',
    'Cada repetición te acerca a tu mejor versión.',
    'La disciplina es el puente entre metas y logros.',
    'Tu competencia más grande eres tú mismo.',
  ]

  for (let i = 0; i < quotes.length; i++) {
    await prisma.coachMotivationalQuote.create({
      data: {
        coachId: coachProfileId,
        quote: quotes[i],
        orderIndex: i,
        isActive: true,
      },
    })
  }
}

async function cleanDatabase() {
  const tables = [
    prisma.workoutBlockResult,
    prisma.workout,
    prisma.planificationItem,
    prisma.planificationSubBlock,
    prisma.planificationBlock,
    prisma.planificationAthleteNote,
    prisma.userProgress,
    prisma.planification,
    prisma.rMRecord,
    prisma.coachCommission,
    prisma.paymentHistory,
    prisma.subscription,
    prisma.coachSubscription,
    prisma.subscriptionPlan,
    prisma.coachStudentRelationship,
    prisma.userDiscipline,
    prisma.userPreference,
    prisma.exercise,
    prisma.disciplineLevel,
    prisma.discipline,
    prisma.coachMotivationalQuote,
    prisma.coachProfile,
    prisma.adminProfile,
    prisma.userRole,
    prisma.user,
    prisma.coachPlanType,
  ]

  for (const table of tables) {
    await (table as any).deleteMany({})
  }
}

async function main() {
  console.log('🌱 Iniciando seed de base de datos local...')

  await cleanDatabase()
  console.log('🧹 Base de datos limpia')

  const coachPlans = await createCoachPlanTypes()
  console.log('✅ Planes de coach creados:', Object.keys(coachPlans).join(', '))

  const admin = await createUser('admin@local.test', 'Admin', 'admin')
  const coach = await createUser('coach@local.test', 'Coach María', 'coach', true)
  const coach2 = await createUser('coach2@local.test', 'Coach Juan (trial)', 'coach', true)
  const students = await Promise.all([
    createUser('student1@local.test', 'Ana García', 'student'),
    createUser('student2@local.test', 'Luis Pérez', 'student'),
    createUser('student3@local.test', 'Carla López', 'student'),
    createUser('student4@local.test', 'Pedro Ruiz', 'student'),
  ])
  console.log('✅ Usuarios creados')

  // Suscripción ELITE para el coach principal
  await prisma.coachSubscription.create({
    data: {
      coachId: coach.coachProfile!.id,
      planId: coachPlans.elite.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 365),
    },
  })

  // Coach 2 en trial (30 días)
  await prisma.coachProfile.update({
    where: { id: coach2.coachProfile!.id },
    data: { trialEndsAt: addDays(new Date(), 30) },
  })

  // Relaciones coach-student
  await prisma.coachStudentRelationship.createMany({
    data: students.map((s) => ({
      coachId: coach.coachProfile!.id,
      studentId: s.id,
      status: 'active',
    })),
  })
  await prisma.coachProfile.update({
    where: { id: coach.coachProfile!.id },
    data: { currentStudentCount: students.length },
  })
  console.log('✅ Relaciones coach-estudiante creadas')

  const disciplines = await createDisciplines(coach.coachProfile!.id)
  console.log('✅ Disciplinas y niveles creados')

  const exercises = await createExercises(coach.coachProfile!.id)
  console.log(`✅ ${exercises.length} ejercicios creados`)

  const studentPlans = await createStudentPlans(coach.coachProfile!.id)
  console.log('✅ Planes de suscripción para estudiantes creados')

  // Suscripciones de estudiantes
  await Promise.all(
    students.map((s, i) =>
      prisma.subscription.create({
        data: {
          userId: s.id,
          planId: studentPlans[i % studentPlans.length].id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: addDays(new Date(), 30),
        },
      })
    )
  )
  console.log('✅ Suscripciones de estudiantes creadas')

  await createPlanifications(coach.coachProfile!.id, disciplines, exercises, students)
  console.log('✅ Planificaciones creadas')

  await createRMRecords(students)
  console.log('✅ Registros RM creados')

  await createWorkouts(students)
  console.log('✅ Workouts sueltos creados')

  await createAthleteNotes(coach.coachProfile!.id, students)
  console.log('✅ Notas de atletas creadas')

  await createMotivationalQuotes(coach.coachProfile!.id)
  console.log('✅ Frases motivacionales creadas')

  console.log('\n🎉 Seed completado exitosamente')
  console.log('\n👤 Usuarios de prueba (contraseña: Test1234!):')
  console.log('  Admin:    admin@local.test')
  console.log('  Coach:    coach@local.test')
  console.log('  Coach 2:  coach2@local.test (trial)')
  console.log('  Students: student1@local.test, student2@local.test, student3@local.test, student4@local.test')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
