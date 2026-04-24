"use client";

import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Marcos Rivas",
    role: "Head Coach, Titan Box",
    quote:
      "Box Plan cambió radicalmente cómo organizo mi semana. Antes perdía horas en hojas de cálculo, ahora todo fluye.",
    initials: "MR",
  },
  {
    name: "Elena Gómez",
    role: "Atleta RX",
    quote:
      "Ver mis PRs graficados y poder comparar mi rendimiento con el resto del box me motiva a dar el 110% cada mañana.",
    initials: "EG",
  },
  {
    name: "Santi Ortiz",
    role: "Owner, Crossnet",
    quote:
      "La analítica de Box Plan me permitió entender qué clases rinden mejor y optimizar mis horarios. Es una inversión, no un gasto.",
    initials: "SO",
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight uppercase text-foreground mb-3"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            Voces del box
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-6 md:p-8">
              <Quote className="w-8 h-8 text-primary/20 mb-4" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-xs font-bold text-primary">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-space), sans-serif" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
