'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function RMHeader() {
	const router = useRouter()

	return (
		<div className="mb-6">
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					onClick={() => router.push('/')}
					className="h-11 w-11 rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
					aria-label="Volver"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
						Registro
					</p>
					<h1 className="text-3xl md:text-4xl font-bold italic text-primary">
						Repeticiones Máximas
					</h1>
				</div>
			</div>
		</div>
	)
}
