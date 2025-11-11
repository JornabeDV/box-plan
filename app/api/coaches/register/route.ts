import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, password, name, businessName, phone, address } = body

		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email y contraseña son requeridos' },
				{ status: 400 }
			)
		}

		// Verificar si el usuario ya existe
		const existing = await prisma.user.findUnique({
			where: { email }
		})

		if (existing) {
			return NextResponse.json(
				{ error: 'El email ya está registrado' },
				{ status: 409 }
			)
		}

		// Hash de la contraseña
		const hashedPassword = await bcrypt.hash(password, 10)

		// Calcular fecha de fin de período de prueba (7 días desde ahora)
		const trialEndsAt = new Date()
		trialEndsAt.setDate(trialEndsAt.getDate() + 7)

		// Crear coach con perfil en una transacción
		const coach = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name: name || email.split('@')[0],
				roles: {
					create: {
						role: 'coach'
					}
				},
				coachProfile: {
					create: {
						businessName: businessName || null,
						phone: phone || null,
						address: address || null,
						maxStudents: 10, // Valor por defecto (Starter)
						commissionRate: 12.00, // Valor por defecto
						trialEndsAt: trialEndsAt // Período de prueba de 7 días
					}
				}
			},
			include: {
				coachProfile: true,
				roles: true
			}
		})

		return NextResponse.json({
			success: true,
			message: 'Coach registrado exitosamente',
			coach: {
				id: coach.id,
				email: coach.email,
				name: coach.name,
				coachProfile: coach.coachProfile
			}
		})
	} catch (error) {
		console.error('Error registering coach:', error)
		return NextResponse.json(
			{ error: 'Error al crear la cuenta de coach' },
			{ status: 500 }
		)
	}
}