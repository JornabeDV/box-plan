'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Weight, History, Loader2, Plus } from 'lucide-react'
import { RMCard } from './rm-card'

interface RMRecord {
	id: number
	exercise: string
	weight: number
	recordedAt: string
}

interface RMListProps {
	rmRecords: RMRecord[]
	loading: boolean
	onNewRMClick: () => void
	onEdit: (rm: { id: number; exercise: string; weight: number }) => void
	onDelete: (id: number, exercise: string) => void
}

export function RMList({ rmRecords, loading, onNewRMClick, onEdit, onDelete }: RMListProps) {
	if (loading) {
		return (
			<>
				{/* Loading en mobile */}
				<div className="sm:hidden flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-lime-400" />
				</div>
				{/* Loading en desktop */}
				<Card className="hidden sm:block">
					<CardContent>
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 animate-spin text-lime-400" />
						</div>
					</CardContent>
				</Card>
			</>
		)
	}

	if (rmRecords.length === 0) {
		return (
			<>
				{/* Empty state en mobile */}
				<div className="sm:hidden text-center py-8 text-muted-foreground">
					<Weight className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<p>No hay RMs registrados aún</p>
					<Button
						className="mt-4"
						onClick={onNewRMClick}
					>
						<Plus className="w-4 h-4 mr-2" />
						Registrar Primer RM
					</Button>
				</div>
				{/* Empty state en desktop */}
				<Card className="hidden sm:block">
					<CardContent>
						<div className="text-center py-8 text-muted-foreground">
							<Weight className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>No hay RMs registrados aún</p>
							<Button
								className="mt-4"
								onClick={onNewRMClick}
							>
								<Plus className="w-4 h-4 mr-2" />
								Registrar Primer RM
							</Button>
						</div>
					</CardContent>
				</Card>
			</>
		)
	}

	return (
		<>
			{/* Título en mobile */}
			<div className="sm:hidden mb-4">
				<h2 className="text-xl font-semibold flex items-center gap-2">
					<History className="w-5 h-5" />
					Mis RMs Registrados
					{rmRecords.length > 0 && (
						<span className="text-sm font-normal text-muted-foreground">
							({rmRecords.length})
						</span>
					)}
				</h2>
			</div>

			{/* Card contenedora solo en desktop */}
			<Card className="hidden sm:block">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="w-5 h-5" />
						Mis RMs Registrados
						{rmRecords.length > 0 && (
							<span className="text-sm font-normal text-muted-foreground">
								({rmRecords.length})
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{rmRecords.map((rm) => (
							<RMCard
								key={rm.id}
								rm={rm}
								onEdit={onEdit}
								onDelete={onDelete}
								variant="desktop"
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Listado sin card en mobile */}
			<div className="sm:hidden space-y-3">
				{rmRecords.map((rm) => (
					<Card key={rm.id} className="py-0">
						<CardContent className="p-3 sm:p-4">
							<RMCard
								rm={rm}
								onEdit={onEdit}
								onDelete={onDelete}
								variant="mobile"
							/>
						</CardContent>
					</Card>
				))}
			</div>
		</>
	)
}