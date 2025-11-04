'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
	id: string
	name: string
	role: string
	avatar: string
	rating: number
	text: string
	plan?: string
	date?: string
}

interface ReviewsSectionProps {
	reviews?: Review[]
	showTitle?: boolean
	variant?: 'default' | 'compact'
	className?: string
}

const defaultReviews: Review[] = [
	{
		id: '1',
		name: 'María González',
		role: 'Atleta Intermedio',
		avatar: 'MG',
		rating: 5,
		text: 'Increíble app para CrossFit. Las planillas son súper completas y el timer es exactamente lo que necesitaba. Llevo 3 meses usándola y mi progreso mejoró notablemente.',
		plan: 'Intermedio',
		date: 'Hace 2 semanas'
	},
	{
		id: '2',
		name: 'Carlos Rodríguez',
		role: 'Coach',
		avatar: 'CR',
		rating: 5,
		text: 'Como coach, me encanta poder asignar planillas a mis atletas. La plataforma es intuitiva y el seguimiento de progreso ayuda mucho a planificar entrenamientos.',
		plan: 'Pro',
		date: 'Hace 1 mes'
	},
	{
		id: '3',
		name: 'Ana Martínez',
		role: 'Atleta Principiante',
		avatar: 'AM',
		rating: 5,
		text: 'Perfecta para empezar en CrossFit. Las planillas básicas son claras y fáciles de seguir. El foro de la comunidad es muy activo y siempre encuentro tips útiles.',
		plan: 'Básico',
		date: 'Hace 3 semanas'
	},
	{
		id: '4',
		name: 'Diego Fernández',
		role: 'Atleta Avanzado',
		avatar: 'DF',
		rating: 5,
		text: 'El análisis de progreso es impresionante. Puedo ver todos mis PRs y cómo he mejorado mes a mes. La calculadora 1RM es muy útil para planificar mis entrenamientos.',
		plan: 'Pro',
		date: 'Hace 5 días'
	},
	{
		id: '5',
		name: 'Laura Sánchez',
		role: 'Atleta Intermedio',
		avatar: 'LS',
		rating: 5,
		text: 'La mejor inversión que hice para mi entrenamiento. El timer profesional con todos los modos es increíble. Ya no necesito otra app para nada.',
		plan: 'Intermedio',
		date: 'Hace 1 semana'
	},
	{
		id: '6',
		name: 'Roberto Pérez',
		role: 'Dueño de Box',
		avatar: 'RP',
		rating: 5,
		text: 'Lo usamos en nuestro box y todos los atletas están encantados. La gestión de planificaciones mensuales hace todo mucho más organizado. Muy recomendable.',
		plan: 'Pro',
		date: 'Hace 2 meses'
	}
]

export function ReviewsSection({ 
	reviews = defaultReviews, 
	showTitle = true,
	variant = 'default',
	className 
}: ReviewsSectionProps) {
	const displayReviews = variant === 'compact' ? reviews.slice(0, 3) : reviews
	const useCarousel = variant === 'default'

	return (
		<section className={cn('py-8 md:py-12', className)}>
			<div className="container mx-auto px-4">
				{showTitle && (
					<div className="text-center mb-6">
						<h2 className="text-xl md:text-2xl font-bold mb-2">
							Lo que dicen nuestros usuarios
						</h2>
						<p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
							Únete a miles de atletas mejorando su rendimiento
						</p>
					</div>
				)}

				{useCarousel ? (
					<div className="max-w-6xl mx-auto px-4 md:px-6">
						<Carousel
							opts={{
								align: 'start',
								loop: true,
								dragFree: true,
							}}
							className="w-full"
						>
							<CarouselContent className="-ml-2 md:-ml-4">
								{displayReviews.map((review) => (
									<CarouselItem key={review.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
										<Card className="bg-card border hover:shadow-lg transition-all duration-300 h-full">
											<CardContent className="p-4">
												{/* Header con avatar y nombre */}
												<div className="flex items-start gap-3 mb-3">
													<Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent">
														<AvatarFallback className="text-white font-semibold text-xs">
															{review.avatar}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<h3 className="font-semibold text-sm truncate">
															{review.name}
														</h3>
														<p className="text-xs text-muted-foreground truncate">
															{review.role}
															{review.plan && (
																<span className="ml-1">• {review.plan}</span>
															)}
														</p>
													</div>
												</div>

												{/* Rating */}
												<div className="flex items-center gap-1 mb-2">
													{[...Array(5)].map((_, i) => (
														<Star
															key={i}
															className={cn(
																'h-3 w-3',
																i < review.rating
																	? 'text-yellow-400 fill-yellow-400'
																	: 'text-muted-foreground/30'
															)}
														/>
													))}
													{review.date && (
														<span className="ml-2 text-xs text-muted-foreground">
															{review.date}
														</span>
													)}
												</div>

												{/* Texto de la reseña */}
												<p className="text-xs text-foreground leading-relaxed line-clamp-4">
													"{review.text}"
												</p>
											</CardContent>
										</Card>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 h-8 w-8" />
							<CarouselNext className="hidden md:flex -right-4 lg:-right-6 h-8 w-8" />
						</Carousel>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
						{displayReviews.map((review) => (
							<Card 
								key={review.id}
								className="bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-border/50"
							>
								<CardContent className="p-6">
									{/* Header con avatar y nombre */}
									<div className="flex items-start gap-3 mb-3">
										<Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent">
											<AvatarFallback className="text-white font-semibold text-xs">
												{review.avatar}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-sm truncate">
												{review.name}
											</h3>
											<p className="text-xs text-muted-foreground truncate">
												{review.role}
												{review.plan && (
													<span className="ml-1">• {review.plan}</span>
												)}
											</p>
										</div>
									</div>

									{/* Rating */}
									<div className="flex items-center gap-1 mb-2">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												className={cn(
													'h-3 w-3',
													i < review.rating
														? 'text-yellow-400 fill-yellow-400'
														: 'text-muted-foreground/30'
												)}
											/>
										))}
										{review.date && (
											<span className="ml-2 text-xs text-muted-foreground">
												{review.date}
											</span>
										)}
									</div>

									{/* Texto de la reseña */}
									<p className="text-xs text-foreground leading-relaxed">
										"{review.text}"
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Promedio de valoración */}
				{showTitle && (
					<div className="mt-6 text-center">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full">
							<div className="flex items-center gap-0.5">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className="h-3 w-3 text-yellow-400 fill-yellow-400"
									/>
								))}
							</div>
							<span className="font-semibold text-sm ml-1">
								4.9/5
							</span>
							<span className="text-xs text-muted-foreground ml-1">
								• {reviews.length}+ reseñas
							</span>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}