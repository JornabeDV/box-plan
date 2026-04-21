"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProgressStats } from "@/hooks/use-progress-stats";
import { useAuth } from "@/hooks/use-auth";
import { Weight, Target, Clock, Flame, BarChart3 } from "lucide-react";

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
}

function StatItem({ icon: Icon, label, value, unit }: StatItemProps) {
  return (
    <Card className="accent-left shadow-none border-l-0">
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-foreground" />
          <span className="label-md text-foreground">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">{value}</span>
          {unit && (
            <span className="text-xs text-foreground">{unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyPerformance() {
  const { user } = useAuth();
  const { stats, loading } = useProgressStats(user?.id);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="headline-md text-foreground uppercase flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Rendimiento Semanal
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-24 animate-pulse">
              <CardContent className="pt-4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalVolume = stats?.totalVolume
    ? `${(stats.totalVolume / 1000).toFixed(1)}k`
    : "0";
  const workoutsCompleted = stats?.workoutsCompleted || 0;
  const totalTime = stats?.totalTime || 0;
  const streak = stats?.streak || 0;

  return (
    <div className="space-y-4">
      <h2 className="headline-md text-foreground uppercase flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Rendimiento Semanal
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={Weight}
          label="Volumen Total"
          value={totalVolume}
          unit="kg"
        />
        <StatItem
          icon={Target}
          label="Entrenamientos"
          value={`${workoutsCompleted}/6`}
          unit="completados"
        />
        <StatItem
          icon={Clock}
          label="Tiempo Total"
          value={totalTime > 0 ? `${Math.round(totalTime / 60)}` : "0"}
          unit="min"
        />
        <StatItem
          icon={Flame}
          label="Racha"
          value={`${streak}`}
          unit="días"
        />
      </div>
    </div>
  );
}
