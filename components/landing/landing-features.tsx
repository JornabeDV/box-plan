"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

const coachFeatures = [
  "Gestión centralizada",
  "Creador de programaciones",
  "Analítica avanzada",
  "Comunicación directa",
  "Feedback instantáneo",
  "Chat integrado",
];

const athleteFeatures = [
  "Acceso instantáneo",
  "Registro de PRs",
  "Sincronización wearables",
  "Tablas de líderes",
  "Comparativa con tu box",
  "Escala posiciones en el ranking",
];

function FeatureList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="p-6 md:p-8">
      <h3
        className="text-lg font-bold tracking-wider uppercase mb-6 text-foreground"
        style={{ fontFamily: "var(--font-space), sans-serif" }}
      >
        {title}
      </h3>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight uppercase text-foreground mb-3"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            Potencia tu ecosistema
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <FeatureList title="Para Coaches" items={coachFeatures} />
          <FeatureList title="Para Atletas" items={athleteFeatures} />
        </div>
      </div>
    </section>
  );
}
