'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Weight, ArrowLeft } from 'lucide-react'

interface RMHeaderProps {
	onNewRMClick: () => void
}

export function RMHeader({ onNewRMClick }: RMHeaderProps) {
	const router = useRouter()

	return (
		<div className="space-y-4">
			{/* Primera fila: Botón Volver y Botón Nuevo RM */}
			<div className="flex items-center justify-between gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push('/')}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="hidden sm:inline">Volver</span>
				</Button>
				<Button
					onClick={onNewRMClick}
					className="flex items-center gap-2 shrink-0"
					size="sm"
				>
					<span className="sm:inline">Nuevo RM</span>
				</Button>
			</div>
			{/* Segunda fila: Título */}
			<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
				<Weight className="w-6 h-6 sm:w-8 sm:h-8 text-lime-400 shrink-0" />
				<span>Repeticiones Máximas</span>
			</h1>
		</div>
	)
}