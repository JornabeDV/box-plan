import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/neon'

// POST /api/admin/workout-sheets/assignments
export async function POST(request: NextRequest) {
	try {
		const session = await auth()
		
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { user_id, sheet_id, due_date, admin_feedback } = body

		if (!user_id || !sheet_id) {
			return NextResponse.json(
				{ error: 'user_id y sheet_id son requeridos' },
				{ status: 400 }
			)
		}

		// Obtener el admin_id del usuario actual
		const adminProfile = await sql`
			SELECT id FROM admin_profiles WHERE user_id = ${session.user.id}
		`

		if (adminProfile.length === 0) {
			return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 })
		}

		const adminId = adminProfile[0].id

		// MVP - Modelo B2C: Permitir a cualquier admin asignar planillas a cualquier usuario
		// TODO: Cuando migren a modelo con coaches/gimnasios, descomentar la validación:
		// Verificar que el usuario está asignado al admin
		// const assignment = await sql`
		//   SELECT user_id FROM admin_user_assignments 
		//   WHERE admin_id = ${adminId} AND user_id = ${user_id} AND is_active = true
		// `
		// if (assignment.length === 0) {
		//   return NextResponse.json(
		//     { error: 'User not assigned to this admin' },
		//     { status: 403 }
		//   )
		// }

		// Verificar que la planilla existe y pertenece al admin
		const workoutSheet = await sql`
			SELECT id, created_by FROM workout_sheets WHERE id = ${sheet_id}
		`

		if (workoutSheet.length === 0) {
			return NextResponse.json({ error: 'Workout sheet not found' }, { status: 404 })
		}

		// Verificar que la planilla pertenece al admin o es pública
		if (workoutSheet[0].created_by !== adminId) {
			const isPublic = await sql`
				SELECT is_public FROM workout_sheets WHERE id = ${sheet_id}
			`
			if (!isPublic[0]?.is_public) {
				return NextResponse.json(
					{ error: 'Workout sheet does not belong to this admin' },
					{ status: 403 }
				)
			}
		}

		// Verificar si ya existe una asignación activa
		const existing = await sql`
			SELECT id FROM workout_sheet_assignments 
			WHERE user_id = ${user_id} AND sheet_id = ${sheet_id} AND is_completed = false
		`

		if (existing.length > 0) {
			return NextResponse.json(
				{ error: 'Ya existe una asignación activa para esta planilla' },
				{ status: 400 }
			)
		}

		// Crear la asignación
		const newAssignment = await sql`
			INSERT INTO workout_sheet_assignments (
				user_id,
				sheet_id,
				admin_id,
				due_date,
				admin_feedback,
				assigned_at
			)
			VALUES (
				${user_id},
				${sheet_id},
				${adminId},
				${due_date || null},
				${admin_feedback || null},
				NOW()
			)
			RETURNING *
		`

		// Obtener la asignación con detalles de la planilla
		const assignmentWithDetails = await sql`
			SELECT 
				a.*,
				ws.id as ws_id,
				ws.title as ws_title,
				ws.description as ws_description,
				c.name as cat_name,
				c.color as cat_color
			FROM workout_sheet_assignments a
			LEFT JOIN workout_sheets ws ON a.sheet_id = ws.id
			LEFT JOIN workout_sheet_categories c ON ws.category_id = c.id
			WHERE a.id = ${newAssignment[0].id}
		`

		const result = assignmentWithDetails[0]
		const transformed = {
			id: result.id,
			user_id: result.user_id,
			sheet_id: result.sheet_id,
			admin_id: result.admin_id,
			assigned_at: result.assigned_at,
			due_date: result.due_date,
			admin_feedback: result.admin_feedback,
			workout_sheet: {
				id: result.ws_id,
				title: result.ws_title,
				description: result.ws_description,
				category: result.cat_name ? {
					name: result.cat_name,
					color: result.cat_color
				} : null
			}
		}

		return NextResponse.json(transformed)
	} catch (error) {
		console.error('Error assigning workout sheet:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}