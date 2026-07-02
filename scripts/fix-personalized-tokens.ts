import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  const personalizedPlans = await prisma.subscriptionPlan.findMany({
    where: {
      isPersonalized: true,
      OR: [
        { shareToken: null },
        { shareToken: '' }
      ]
    },
    select: { id: true, name: true, shareToken: true }
  })

  console.log(`Found ${personalizedPlans.length} personalized plans missing shareToken`)

  for (const plan of personalizedPlans) {
    const newToken = nanoid(24)
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: { shareToken: newToken }
    })
    console.log(`Updated plan ${plan.id} "${plan.name}" -> ${newToken}`)
  }

  console.log('Done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
