import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const RankingUnauthorized = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">No autorizado</h2>
        <Button onClick={() => router.push("/login")}>Iniciar Sesión</Button>
      </div>
    </div>
  );
};
