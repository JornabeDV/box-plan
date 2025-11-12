'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Building2 } from 'lucide-react'
import Image from 'next/image'

interface Coach {
	id: number
	userId: number
	name: string
	email: string
	image: string | null
	businessName: string | null
	phone: string | null
	address: string | null
	joinedAt: string | Date
}

interface CoachInfoCardProps {
	coach: Coach
}

export function CoachInfoCard({ coach }: CoachInfoCardProps) {
	return (
		<Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="w-5 h-5 text-primary" />
					Tu Coach
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Información del coach */}
				<div className="flex items-start gap-4">
					{coach.image ? (
						<div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30">
							<Image
								src={coach.image}
								alt={coach.name}
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
							<User className="w-8 h-8 text-primary" />
						</div>
					)}
					<div className="flex-1 space-y-2">
						<div>
							<h3 className="font-semibold text-lg">{coach.name}</h3>
							{coach.businessName && (
								<div className="flex items-center gap-1 text-sm text-muted-foreground">
									<Building2 className="w-4 h-4" />
									<span>{coach.businessName}</span>
								</div>
							)}
						</div>
						<Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
							Coach Asignado
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}