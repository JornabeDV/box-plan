import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Weight, Hash, Trophy, Users } from "lucide-react";
import { RankingParticipantItem } from "./ranking-participant-item";
import type { Ranking } from "@/hooks/use-ranking";

interface RankingCardProps {
  ranking: Ranking;
  currentUserId?: string | number;
}

export const RankingCard = ({ ranking, currentUserId }: RankingCardProps) => {
  return (
    <Card key={`${ranking.wod_name}-${ranking.type}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl flex items-start gap-2 leading-tight">
            {ranking.type === "time" ? (
              <Timer className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            ) : ranking.type === "weight" ? (
              <Weight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            ) : ranking.type === "rounds_reps" ? (
              <Trophy className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Hash className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="break-words">{ranking.wod_name}</span>
          </CardTitle>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs px-2 py-0.5 self-start sm:self-auto flex-shrink-0"
          >
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
