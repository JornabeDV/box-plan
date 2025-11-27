import { Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/ranking-helpers";
import type { RankingParticipant, Ranking } from "@/hooks/use-ranking";

interface RankingParticipantItemProps {
  participant: RankingParticipant;
  ranking: Ranking;
  currentUserId?: string | number;
}

export const RankingParticipantItem = ({
  participant,
  ranking,
  currentUserId,
}: RankingParticipantItemProps) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Medal className="w-5 h-5 text-yellow-400 fill-yellow-400" />;
    if (rank === 2)
      return <Medal className="w-5 h-5 text-gray-300 fill-gray-300" />;
    if (rank === 3)
      return <Medal className="w-5 h-5 text-orange-400 fill-orange-400" />;
    return null;
  };

  const getRankStyles = (rank: number) => {
    if (rank <= 3) {
      if (rank === 1) return "bg-yellow-400/10 border-yellow-400/30";
      if (rank === 2) return "bg-gray-300/10 border-gray-300/30";
      return "bg-orange-400/10 border-orange-400/30";
    }
    return "bg-card";
  };

  const isCurrentUser = String(participant.user_id) === String(currentUserId);

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${getRankStyles(
        participant.rank
      )}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          {getRankIcon(participant.rank) || (
            <span className="text-sm font-bold">{participant.rank}</span>
          )}
        </div>
        <div>
          <div className="font-semibold">
            {participant.user_name}
            {isCurrentUser && (
              <Badge variant="outline" className="ml-2 text-xs">
                Tú
              </Badge>
            )}
          </div>
          {participant.notes && (
            <div className="text-xs text-muted-foreground">
              {participant.notes}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        {ranking.type === "time" && participant.duration_seconds ? (
          <>
            <div className="text-lg font-bold text-lime-400">
              {formatDuration(participant.duration_seconds)}
            </div>
            <div className="text-xs text-muted-foreground">Tiempo</div>
          </>
        ) : ranking.type === "strength" && participant.weight ? (
          <>
            <div className="text-lg font-bold text-blue-400">
              {participant.weight} kg
            </div>
            <div className="text-xs text-muted-foreground">Peso</div>
          </>
        ) : null}
      </div>
    </div>
  );
};
