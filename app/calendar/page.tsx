"use client";

import { FullCalendar } from "@/components/dashboard/full-calendar";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              Vista General
            </p>
            <h1 className="text-2xl md:text-3xl font-bold italic text-primary">
              Calendario Completo
            </h1>
          </div>
        </div>

        {/* Calendario */}
        <FullCalendar />
      </div>

      <BottomNavigation />
    </div>
  );
}
