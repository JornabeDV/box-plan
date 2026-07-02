import { prisma } from '../lib/prisma'

async function main() {
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.coachProfile.count(),
    prisma.coachPlanType.count(),
    prisma.coachSubscription.count(),
    prisma.coachStudentRelationship.count(),
    prisma.discipline.count(),
    prisma.disciplineLevel.count(),
    prisma.exercise.count(),
    prisma.subscriptionPlan.count(),
    prisma.subscription.count(),
    prisma.planification.count(),
    prisma.planificationBlock.count(),
    prisma.planificationSubBlock.count(),
    prisma.planificationItem.count(),
    prisma.workout.count(),
    prisma.workoutBlockResult.count(),
    prisma.rMRecord.count(),
    prisma.planificationAthleteNote.count(),
    prisma.coachMotivationalQuote.count(),
  ])

  const labels = [
    'users',
    'coachProfiles',
    'coachPlanTypes',
    'coachSubscriptions',
    'coachStudentRelationships',
    'disciplines',
    'disciplineLevels',
    'exercises',
    'subscriptionPlans',
    'subscriptions',
    'planifications',
    'planificationBlocks',
    'planificationSubBlocks',
    'planificationItems',
    'workouts',
    'workoutBlockResults',
    'rmRecords',
    'planificationAthleteNotes',
    'coachMotivationalQuotes',
  ]

  console.log('📊 Conteo de registros:')
  labels.forEach((label, i) => {
    console.log(`  ${label.padEnd(30)} ${counts[i]}`)
  })

  // Verificar login de coach
  const coach = await prisma.user.findUnique({
    where: { email: 'coach@local.test' },
    include: { roles: true, coachProfile: true },
  })
  console.log('\n👤 Coach de prueba:')
  console.log(`  Email: ${coach?.email}`)
  console.log(`  Rol: ${coach?.roles[0]?.role}`)
  console.log(`  CoachProfile ID: ${coach?.coachProfile?.id}`)

  // Verificar planificación de hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaysPlan = await prisma.planification.findFirst({
    where: { date: today },
    include: { blocks: { include: { items: true, subBlocks: { include: { items: true } } } } },
  })
  console.log('\n📅 Planificación de hoy:')
  console.log(`  Título: ${todaysPlan?.title}`)
  console.log(`  Bloques: ${todaysPlan?.blocks.length}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
