"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-20 md:py-28 bg-[#020c10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-3xl mx-auto">
          <Card className="p-10 md:p-14 text-center">
            <h2
              className="text-3xl md:text-5xl font-bold tracking-tight uppercase text-foreground mb-4"
              style={{ fontFamily: "var(--font-space), sans-serif" }}
            >
              ¿Sos coach?{" "}
              <span className="text-primary italic">Empezá hoy</span>
            </h2>

            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-8">
              Unite a la red de coaches que están transformando el fitness en
              Latinoamérica.
            </p>

            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Crear cuenta gratis
            </Button>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-[10px] md:text-xs text-muted-foreground tracking-wider uppercase">
              <span>Sin tarjeta de crédito</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>14 días de prueba full</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>Soporte 24/7</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
