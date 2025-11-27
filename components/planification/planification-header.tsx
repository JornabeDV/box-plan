"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanificationHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  formattedDate?: string;
}

export function PlanificationHeader({
  selectedDate,
  isToday,
  formattedDate,
}: PlanificationHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col items-start">
      <div className="flex items-start gap-2 md:justify-between w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 shrink-0 md:order-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
        <div className="md:order-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {isToday ? "Planificación de Hoy" : "Planificación"}
          </h1>
          {!isToday && formattedDate && (
            <p className="text-sm md:text-base text-zinc-400 font-medium mt-1">
              {formattedDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
