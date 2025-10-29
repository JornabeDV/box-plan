import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await sql`
      SELECT *
      FROM subscriptions
      WHERE user_id = ${session.user.id} AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `

    return NextResponse.json(subscriptions[0] || null)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}