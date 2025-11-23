import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para revisar y actualizar suscripciones vencidas
 * 
 * Este endpoint debe ser llamado por un cron job diario
 * 
 * Seguridad: Verificar que la petición viene de Vercel Cron o usar un secret token
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
		
		// Buscar suscripciones activas que han vencido
		const expiredSubscriptions = await prisma.subscription.findMany({
			where: {
				status: 'active',
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

		// Actualizar status a 'past_due' para suscripciones vencidas
		const updateResult = await prisma.subscription.updateMany({
			where: {
				id: {
					in: expiredSubscriptions.map(s => s.id)
				}
			},
			data: {
				status: 'past_due'
			}
		})

		// Log para debugging (opcional: enviar a servicio de logging)
		console.log(`[Cron] Revisadas suscripciones vencidas: ${expiredSubscriptions.length} encontradas, ${updateResult.count} actualizadas`)

		return NextResponse.json({
			success: true,
			expiredCount: expiredSubscriptions.length,
			updatedCount: updateResult.count,
			expiredSubscriptions: expiredSubscriptions.map(s => ({
				id: s.id,
				userId: s.userId,
				userEmail: s.user.email,
				planName: s.plan.name,
				expiredAt: s.currentPeriodEnd
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