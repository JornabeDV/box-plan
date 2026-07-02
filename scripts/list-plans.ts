import { prisma } from '../lib/prisma'

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, name: true, isPersonalized: true, coachId: true, price: true, shareToken: true }
  })
  console.log(JSON.stringify(plans, null, 2))
  await prisma.$disconnect()
}

main()
