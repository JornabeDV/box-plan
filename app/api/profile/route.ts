import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeUserId } from '@/lib/auth-helpers'
import { getCachedProfile } from '@/lib/cache'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const profile = await getCachedProfile(userId)

		const response = NextResponse.json(profile)
		response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
		return response
	} catch (error: any) {
		console.error('Error fetching profile:', error?.message || error)
		return NextResponse.json(null)
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await auth()
		const userId = normalizeUserId(session?.user?.id)

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { full_name, avatar_url, phone, current_password, new_password } = body

		const updateData: any = {}
		if (full_name !== undefined) updateData.name = full_name
		if (avatar_url !== undefined) updateData.image = avatar_url
		if (phone !== undefined) updateData.phone = phone

		if (current_password !== undefined || new_password !== undefined) {
			if (!current_password || !new_password) {
				return NextResponse.json({ error: 'Debes ingresar la contraseña actual y la nueva' }, { status: 400 })
			}

			const trimmedNew = new_password.trim()
			if (trimmedNew.length < 6) {
				return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
			}

			const userWithPassword = await prisma.user.findUnique({
				where: { id: userId },
				select: { password: true }
			})

			if (!userWithPassword) {
				return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
			}

			const valid = await bcrypt.compare(current_password, userWithPassword.password)
			if (!valid) {
				return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
			}

			updateData.password = await bcrypt.hash(trimmedNew, 10)
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
		}

		const user = await prisma.user.update({
			where: { id: userId },
			data: updateData
		})

		revalidateTag('profile')

		const profile = {
			id: user.id,
			full_name: user.name || user.email,
			avatar_url: user.image,
			created_at: user.createdAt,
			updated_at: user.updatedAt
		}

		return NextResponse.json(profile)
	} catch (error) {
		console.error('Error updating profile:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
