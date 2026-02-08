import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { requireProgressTracking } from '@/lib/api-feature-guards'

// GET /api/rms?userId=xxx
export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')

		const sessionUserId = normalizeUserId(session?.user?.id)
		if (!sessionUserId && !userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const targetUserId = userId ? parseInt(userId, 10) : sessionUserId

		if (!targetUserId) {
			return NextResponse.json({ error: 'User ID required' }, { status: 400 })
		}

		const rmRecords = await prisma.rMRecord.findMany({
			where: { userId: targetUserId },
			orderBy: { recordedAt: 'desc' }
		})

		return NextResponse.json(rmRecords)
	} catch (error) {
		console.error('Error fetching RM records:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST /api/rms
export async function POST(request: NextRequest) {
	try {
		const session = await auth()
		
		const userId = normalizeUserId(session?.user?.id)
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Verificar si el usuario tiene acceso a la carga de scores
		const guard = await requireProgressTracking(userId)
		if (!guard.allowed && guard.response) {
			return guard.response
		}

		const body = await request.json()
		const { exercise, weight, recorded_at } = body

		if (!exercise || !weight) {
			return NextResponse.json(
				{ error: 'Exercise and weight are required' },
				{ status: 400 }
			)
		}

		const weightDecimal = typeof weight === 'string' ? parseFloat(weight) : weight
		if (isNaN(weightDecimal) || weightDecimal <= 0) {
			return NextResponse.json(
				{ error: 'Weight must be a positive number' },
				{ status: 400 }
			)
		}

		const result = await prisma.rMRecord.create({
			data: {
				userId,
				exercise: exercise.trim(),
				weight: weightDecimal,
				recordedAt: recorded_at ? new Date(recorded_at) : new Date()
			}
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('Error creating RM record:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}