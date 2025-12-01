"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";

interface ProgressStatsCardsProps {
  stats: {
    totalScores?: number;
    thisWeek?: number;
    thisMonth?: number;
    streak?: number;
  } | null;
  rmCount: number;
  loading: boolean;
}

export function ProgressStatsCards({
  stats,
  rmCount,
  loading,
}: ProgressStatsCardsProps) {
  const router = useRouter();
  const { canLoadScores } = useCoachPlanFeatures();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin text-lime-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Cargando...</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
      <Card className="py-2">
        <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-lime-400 mb-1">
              {stats?.totalScores || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Scores</div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-2">
        <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {stats?.thisWeek || 0}
            </div>
            <div className="text-sm text-muted-foreground">Esta Semana</div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-2">
        <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {stats?.thisMonth || 0}
            </div>
            <div className="text-sm text-muted-foreground">Este Mes</div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-2">
        <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {stats?.streak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Racha (días)</div>
          </div>
        </CardContent>
      </Card>

      {canLoadScores ? (
        <Card
          className="cursor-pointer hover:bg-gray-900/10 dark:hover:bg-gray-100/5 transition-colors py-2"
          onClick={() => router.push("/log-rm")}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/log-rm");
            }
          }}
          role="button"
          aria-label="Ver repeticiones máximas"
        >
          <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-lime-400 mb-1">
                {rmCount}
              </div>
              <div className="text-sm text-muted-foreground">Mis RMs</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-2 opacity-50">
          <CardContent className="pt-2 pb-2 md:pt-6 md:pb-6 px-2 md:px-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-lime-400 mb-1">
                {rmCount}
              </div>
              <div className="text-sm text-muted-foreground">Mis RMs</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
