"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  plan?: string;
  date?: string;
}

interface ReviewsSectionProps {
  reviews?: Review[];
  showTitle?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

const defaultReviews: Review[] = [
  {
    id: "1",
    name: "María González",
    role: "Atleta Intermedio",
    avatar: "MG",
    rating: 5,
    text: "Increíble app para CrossFit. Las planificaciones son súper claras y el timer es exactamente lo que necesitaba. Llevo 3 meses usándola y mi progreso mejoró notablemente.",
    plan: "Intermedio",
    date: "Hace 2 semanas",
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    role: "Coach",
    avatar: "CR",
    rating: 5,
    text: "Como coach, me encanta poder asignar planificaciones a mis atletas. La plataforma es intuitiva y el seguimiento de progreso ayuda mucho a planificar entrenamientos.",
    plan: "Pro",
    date: "Hace 1 mes",
  },
  {
    id: "3",
    name: "Ana Martínez",
    role: "Atleta Principiante",
    avatar: "AM",
    rating: 5,
    text: "Perfecta para empezar en CrossFit. Las planificaciones básicas son claras y fáciles de seguir.",
    plan: "Básico",
    date: "Hace 3 semanas",
  },
  {
    id: "4",
    name: "Diego Fernández",
    role: "Atleta Avanzado",
    avatar: "DF",
    rating: 5,
    text: "App muy dinámica, fácil de usar. La calculadora RM es muy útil para planificar mis entrenamientos.",
    plan: "Pro",
    date: "Hace 5 días",
  },
  {
    id: "5",
    name: "Laura Sánchez",
    role: "Atleta Intermedio",
    avatar: "LS",
    rating: 5,
    text: "La mejor inversión que hice para mi entrenamiento. El timer profesional con todos los modos es increíble. Ya no necesito otra app para nada.",
    plan: "Intermedio",
    date: "Hace 1 semana",
  },
  {
    id: "6",
    name: "Roberto Pérez",
    role: "Dueño de Box",
    avatar: "RP",
    rating: 5,
    text: "Lo usamos en nuestro box y todos los atletas están encantados. La gestión de planificaciones mensuales hace todo mucho más organizado. Muy recomendable.",
    plan: "Pro",
    date: "Hace 2 meses",
  },
];

export function ReviewsSection({
  reviews = defaultReviews,
  showTitle = true,
  variant = "default",
  className,
}: ReviewsSectionProps) {
  const displayReviews = variant === "compact" ? reviews.slice(0, 3) : reviews;
  const useCarousel = variant === "default";

  return (
    <section>
      <div className="max-w-7xl mx-auto">
        {showTitle && (
          <h2 className="font-headline text-3xl font-bold tracking-tighter uppercase text-center mb-2">
            LO QUE DICEN{" "}
            <span className="text-primary italic text-glow">
              NUESTROS ATLETAS
            </span>
          </h2>
        )}

        {useCarousel ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {displayReviews.map((review, index) => (
                <CarouselItem
                  key={review.id}
                  className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card
                    className={cn(
                      "border-l-0 bg-surface-container p-4 relative hover:border-primary/30 transition-colors h-full",
                      index === 1 &&
                        "scale-105 border-t-4 border-primary z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                    )}
                  >
                    <p className="text-on-surface-variant italic mb-2 md:mb-4 text-sm leading-relaxed">
                      "{review.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border border-primary/20">
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {review.avatar}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-sm">
                          {review.name}
                        </h5>
                        <p className="text-primary text-[10px] font-bold tracking-widest uppercase">
                          {review.role}
                        </p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:-left-12" />
            <CarouselNext className="right-2 md:-right-12" />
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {displayReviews.map((review) => (
              <Card
                key={review.id}
                className="bg-surface-container p-6 rounded-lg relative hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-0">
                  {/* Header con avatar y nombre */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">
                        {review.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate text-white">
                        {review.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant truncate">
                        {review.role}
                        {review.plan && (
                          <span className="ml-1">• {review.plan}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30",
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
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    "{review.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
