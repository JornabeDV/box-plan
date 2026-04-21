'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
			<div>
				<p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
					Registro
				</p>
				<h1 className="text-3xl md:text-4xl font-bold italic text-primary">
					Repeticiones Máximas
				</h1>
			</div>
		</div>
	)
}