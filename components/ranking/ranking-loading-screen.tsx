import { Loader2 } from "lucide-react";

export const RankingLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
        <span>Cargando...</span>
      </div>
    </div>
  );
};
