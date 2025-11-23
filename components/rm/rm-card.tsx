'use client'

import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RMCardProps {
	rm: {
		id: number
		exercise: string
		weight: number
		recordedAt: string
	}
	onEdit: (rm: { id: number; exercise: string; weight: number }) => void
	onDelete: (id: number, exercise: string) => void
	variant?: 'desktop' | 'mobile'
}

export function RMCard({ rm, onEdit, onDelete, variant = 'desktop' }: RMCardProps) {
	if (variant === 'mobile') {
		return (
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				{/* Nombre del ejercicio y fecha */}
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-lg break-words">
						{rm.exercise}
					</div>
					<div className="text-sm text-muted-foreground mt-1">
						{format(new Date(rm.recordedAt), 'dd/MM/yyyy', { locale: es })}
					</div>
				</div>
				{/* Peso y botones */}
				<div className="flex items-center justify-between sm:justify-end gap-3">
					<div className="text-right">
						<div className="font-bold text-xl text-lime-400">
							{rm.weight} kg
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onEdit({ id: rm.id, exercise: rm.exercise, weight: rm.weight })}
							className="text-primary hover:text-primary h-9 w-9 p-0"
							aria-label="Editar RM"
						>
							<Edit className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDelete(rm.id, rm.exercise)}
							className="text-destructive hover:text-destructive h-9 w-9 p-0"
							aria-label="Eliminar RM"
						>
							<Trash2 className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		)
	}

	// Variante desktop
	return (
		<div className="flex items-center justify-between p-4 bg-card rounded-lg border">
			<div className="flex-1">
				<div className="font-semibold text-lg">
					{rm.exercise}
				</div>
				<div className="text-sm text-muted-foreground">
					{format(new Date(rm.recordedAt), 'dd/MM/yyyy', { locale: es })}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<div className="text-right">
					<div className="font-bold text-xl text-lime-400">
						{rm.weight} kg
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit({ id: rm.id, exercise: rm.exercise, weight: rm.weight })}
					className="text-primary hover:text-primary"
					aria-label="Editar RM"
				>
					<Edit className="w-4 h-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onDelete(rm.id, rm.exercise)}
					className="text-destructive hover:text-destructive"
					aria-label="Eliminar RM"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>
		</div>
	)
}