"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";
import { RequireActiveSubscription } from "@/components/auth/require-active-subscription";

const PERCENTAGES = [
  { label: "100%", value: 1.0 },
  { label: "95%", value: 0.95 },
  { label: "90%", value: 0.9 },
  { label: "85%", value: 0.85 },
  { label: "80%", value: 0.8 },
  { label: "75%", value: 0.75 },
  { label: "70%", value: 0.7 },
  { label: "65%", value: 0.65 },
  { label: "60%", value: 0.6 },
  { label: "55%", value: 0.55 },
  { label: "50%", value: 0.5 },
];

export default function RMCalculatorPage() {
  const router = useRouter();
  const [rm, setRm] = useState<string>("");

  const rmValue = parseFloat(rm);
  const isValid = !isNaN(rmValue) && rmValue > 0;

  const formatWeight = (weight: number): string => {
    return weight.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  };

  return (
    <RequireActiveSubscription>
      <div className="min-h-[100dvh] relative overflow-hidden bg-background text-foreground">
        <div
          className="absolute inset-0 kinetic-grid-bg pointer-events-none"
          aria-hidden="true"
        />

        <main className="p-6 space-y-6 pb-24 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="h-11 w-11 rounded-none bg-primary/5 border-primary/50 text-primary hover:bg-primary/10 shrink-0"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Herramienta
                </p>
                <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
                  Calculadora RM
                </h1>
              </div>
            </div>
          </div>

          {/* Input */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="label-md">Tu RM</span>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="rm-input"
                  className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground"
                >
                  Peso máximo (1RM)
                </label>
                <Input
                  id="rm-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="Ej: 100"
                  value={rm}
                  onChange={(e) => setRm(e.target.value)}
                  className="h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Percentages table */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="label-md">Porcentajes</span>
              </div>

              {!isValid ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ingresá tu RM para ver los porcentajes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {PERCENTAGES.map((percentage) => {
                    const weight = rmValue * percentage.value;
                    return (
                      <div
                        key={percentage.label}
                        className="flex items-center justify-between p-3 bg-surface-container-high border border-outline/20"
                      >
                        <span className="font-semibold text-primary">
                          {percentage.label}
                        </span>
                        <span className="font-bold text-foreground">
                          {formatWeight(weight)} kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <BottomNavigation />
      </div>
    </RequireActiveSubscription>
  );
}
