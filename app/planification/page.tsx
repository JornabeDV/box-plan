import { Suspense } from "react";
import { PlanificationContent } from "./planification-content";

export default function PlanificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Cargando planificación...
          </div>
        </div>
      }
    >
      <PlanificationContent />
    </Suspense>
  );
}
