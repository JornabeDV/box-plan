"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import { useRanking } from "@/hooks/use-ranking";
import { RankingHeader } from "@/components/ranking/ranking-header";
import { RankingDateSelector } from "@/components/ranking/ranking-date-selector";
import { RankingCard } from "@/components/ranking/ranking-card";
import { RankingEmptyState } from "@/components/ranking/ranking-empty-state";
import { RankingLoadingScreen } from "@/components/ranking/ranking-loading-screen";
import { RankingUnauthorized } from "@/components/ranking/ranking-unauthorized";
import { Lock } from "lucide-react";

const getInitialDate = (): Date => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

export default function RankingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { canViewRanking, loading: subscriptionLoading } =
    useStudentSubscription();
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const { rankingData, loading } = useRanking(user?.id, selectedDate);

  if (authLoading || subscriptionLoading || loading) {
    return <RankingLoadingScreen />;
  }

  if (!user) {
    return <RankingUnauthorized />;
  }

  if (!canViewRanking) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="p-6 pb-32 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Funcionalidad no disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                La página de Ranking no está incluida en tu plan actual.
              </p>
              <p className="text-sm text-muted-foreground">
                Para acceder a esta funcionalidad, necesitas un plan que incluya
                la base de datos de scores.
              </p>
              <Button
                onClick={() => router.push("/subscription")}
                className="w-full"
              >
                Ver Planes Disponibles
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="p-6 space-y-6 pb-32 max-w-6xl mx-auto">
        <RankingHeader />

        <RankingDateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          rankingDate={rankingData?.date}
        />

        {!rankingData || rankingData.rankings.length === 0 ? (
          <RankingEmptyState isLoading={!rankingData} />
        ) : (
          rankingData.rankings.map((ranking) => (
            <RankingCard
              key={`${ranking.wod_name}-${ranking.type}`}
              ranking={ranking}
              currentUserId={user?.id as string | number | undefined}
            />
          ))
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
