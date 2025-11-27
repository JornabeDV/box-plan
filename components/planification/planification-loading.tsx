"use client";

import { Loader2 } from "lucide-react";

export function PlanificationLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-lime-400 mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando planificación...</p>
      </div>
    </div>
  );
}
