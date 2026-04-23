import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
        <div className="md:order-1">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Competencia
          </p>
          <h1 className="text-3xl md:text-4xl font-bold italic text-primary">
            Ranking
          </h1>
        </div>
      </div>
    </div>
  );
};
