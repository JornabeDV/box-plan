import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RankingHeader = () => {
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 md:justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 md:order-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2 md:order-1">
          <Trophy className="w-8 h-8 text-lime-400" />
          Ranking
        </h1>
      </div>
    </div>
  );
};
