"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanificationEmptyStateProps {
  isToday: boolean;
  formattedDate?: string;
}

export function PlanificationEmptyState({
  isToday,
  formattedDate,
}: PlanificationEmptyStateProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-6 text-center py-12">
        <Calendar className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-4 text-white">
          {isToday
            ? "No hay planificación para hoy"
            : `No hay planificación para el ${formattedDate || ""}`}
        </h3>
        <Button onClick={() => router.push("/")}>Volver al inicio</Button>
      </CardContent>
    </Card>
  );
}
