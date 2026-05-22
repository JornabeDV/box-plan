import { Suspense } from "react";
import { PlanificationContent } from "./planification-content";
import { RequireActiveSubscription } from "@/components/auth/require-active-subscription";

export default function PlanificationPage() {
  return (
    <RequireActiveSubscription>
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
    </RequireActiveSubscription>
  );
}
