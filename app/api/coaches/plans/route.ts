import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
	try {
		const plans = await prisma.coachPlanType.findMany({
			where: {
				isActive: true
			},
			orderBy: {
				basePrice: 'asc'
			}
		})

		return NextResponse.json({
			success: true,
			plans
		})
	} catch (error) {
		console.error('Error fetching coach plans:', error)
		return NextResponse.json(
			{ error: 'Error al obtener los planes' },
			{ status: 500 }
		)
	}
}