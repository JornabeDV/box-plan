import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Weight, Users } from "lucide-react";
import { RankingParticipantItem } from "./ranking-participant-item";
import type { Ranking } from "@/hooks/use-ranking";

interface RankingCardProps {
  ranking: Ranking;
  currentUserId?: string | number;
}

export const RankingCard = ({ ranking, currentUserId }: RankingCardProps) => {
  return (
    <Card key={`${ranking.wod_name}-${ranking.type}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {ranking.type === "time" ? (
              <Timer className="w-5 h-5 text-lime-400" />
            ) : (
              <Weight className="w-5 h-5 text-blue-400" />
            )}
            {ranking.wod_name}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {ranking.total_participants} participante
            {ranking.total_participants !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.participants.map((participant) => (
            <RankingParticipantItem
              key={participant.id}
              participant={participant}
              ranking={ranking}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
