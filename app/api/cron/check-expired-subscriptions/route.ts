import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para revisar y actualizar suscripciones vencidas
 * 
 * Este endpoint debe ser llamado por un cron job diario
 * 
 */
export async function GET(request: NextRequest) {
	try {
		// Verificar autorización con secret token (requerido para seguridad)
		const authHeader = request.headers.get('authorization')
		const cronSecret = process.env.CRON_SECRET
		
		// El secret es obligatorio para proteger el endpoint
		if (!cronSecret) {
			console.error('[Cron] CRON_SECRET no está configurado en variables de entorno')
			return NextResponse.json(
				{ error: 'CRON_SECRET no configurado. Configure la variable de entorno CRON_SECRET.' },
				{ status: 500 }
			)
		}
		
		// Validar el token
		if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
			console.warn('[Cron] Intento de acceso no autorizado')
			return NextResponse.json(
				{ error: 'Unauthorized. Token inválido o faltante.' },
				{ status: 401 }
			)
		}

		const now = new Date()
		
		// PASO 1: Buscar suscripciones activas con cancelAtPeriodEnd=true que han vencido
		// Estas deben cambiar a 'canceled'
		const pendingCancellationSubscriptions = await prisma.subscription.findMany({
			where: {
				status: 'active',
				cancelAtPeriodEnd: true,
				currentPeriodEnd: {
					lt: now // Menor que ahora = vencida
				}
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true
					}
				},
				plan: {
					select: {
						name: true
					}
				}
			}
		})

		// Actualizar status a 'canceled' para las que tenían cancelAtPeriodEnd
		const canceledResult = await prisma.subscription.updateMany({
			where: {
				id: {
					in: pendingCancellationSubscriptions.map(s => s.id)
				}
			},
			data: {
				status: 'canceled'
			}
		})

		// PASO 2: Buscar suscripciones activas SIN cancelAtPeriodEnd que han vencido
		// Estas deben cambiar a 'past_due' (para renovación/pago pendiente)
		const expiredActiveSubscriptions = await prisma.subscription.findMany({
			where: {
				status: 'active',
				cancelAtPeriodEnd: false,
				currentPeriodEnd: {
					lt: now // Menor que ahora = vencida
				}
			},
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true
					}
				},
				plan: {
					select: {
						name: true
					}
				}
			}
		})

		// Actualizar status a 'past_due' para suscripciones vencidas sin cancelación pendiente
		const pastDueResult = await prisma.subscription.updateMany({
			where: {
				id: {
					in: expiredActiveSubscriptions.map(s => s.id)
				}
			},
			data: {
				status: 'past_due'
			}
		})

		// Log para debugging (opcional: enviar a servicio de logging)
		console.log(`[Cron] Suscripciones procesadas: ${pendingCancellationSubscriptions.length} canceladas, ${expiredActiveSubscriptions.length} vencidas (past_due)`)

		return NextResponse.json({
			success: true,
			canceledCount: pendingCancellationSubscriptions.length,
			canceledUpdated: canceledResult.count,
			pastDueCount: expiredActiveSubscriptions.length,
			pastDueUpdated: pastDueResult.count,
			canceledSubscriptions: pendingCancellationSubscriptions.map(s => ({
				id: s.id,
				userId: s.userId,
				userEmail: s.user.email,
				planName: s.plan.name,
				expiredAt: s.currentPeriodEnd,
				reason: 'cancel_at_period_end'
			})),
			pastDueSubscriptions: expiredActiveSubscriptions.map(s => ({
				id: s.id,
				userId: s.userId,
				userEmail: s.user.email,
				planName: s.plan.name,
				expiredAt: s.currentPeriodEnd,
				reason: 'payment_pending'
			}))
		})
	} catch (error) {
		console.error('[Cron] Error al revisar suscripciones vencidas:', error)
		return NextResponse.json(
			{ 
				error: 'Error al procesar suscripciones vencidas',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}

// Permitir POST también (algunos servicios de cron usan POST)
export const POST = GET