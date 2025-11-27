import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";

interface RankingEmptyStateProps {
  isLoading: boolean;
}

export const RankingEmptyState = ({ isLoading }: RankingEmptyStateProps) => {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-12">
        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-lime-400 opacity-50" />
            <p className="text-muted-foreground">Cargando ranking...</p>
          </>
        ) : (
          <>
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No hay rankings disponibles para esta fecha
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
