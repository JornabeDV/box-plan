import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { User, Timer, Calculator, Settings, Hash, HomeIcon } from "lucide-react";
import Link from "next/link";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useCoachPlanFeatures } from "@/hooks/use-coach-plan-features";

export const BottomNavigation = memo(function BottomNavigation() {
  const { isAdmin, isCoach } = useAuthWithRoles();
  const { canLoadScores, loading: planFeaturesLoading } = useCoachPlanFeatures();
  
  // Memoizar los valores para evitar re-renders innecesarios
  const showRMButton = useMemo(() => {
    return !planFeaturesLoading && canLoadScores;
  }, [planFeaturesLoading, canLoadScores]);
  
  const showCoachDashboard = useMemo(() => {
    return isCoach;
  }, [isCoach]);
  
  const showAdminDashboard = useMemo(() => {
    return isAdmin && !isCoach;
  }, [isAdmin, isCoach]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-muted border-t border-border">
      <div className="flex items-center justify-around py-3 px-2">
        <Link href="/" className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Button>
        </Link>

        <Link href="/profile" className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Perfil</span>
          </Button>
        </Link>

        <Link href="/timer" className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
          >
            <Timer className="w-5 h-5" />
            <span className="text-xs font-medium">Timer</span>
          </Button>
        </Link>

        {showRMButton && (
          <Link href="/log-rm" className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
            >
              <Calculator className="w-5 h-5" />
              <span className="text-xs font-medium">RM</span>
            </Button>
          </Link>
        )}

        {showCoachDashboard && (
          <Link
            href="/admin-dashboard"
            className="flex items-center justify-center"
          >
            <Button
              variant="ghost"
              className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Dashboard</span>
            </Button>
          </Link>
        )}

        {showAdminDashboard && (
          <Link
            href="/admin-dashboard"
            className="flex items-center justify-center"
          >
            <Button
              variant="ghost"
              className="justify-center items-center whitespace-nowrap transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group border-2 border-lime-400/50 bg-transparent text-lime-400 font-semibold hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] w-16 h-16 rounded-lg p-0 text-xs flex flex-col gap-1"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Admin</span>
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
});
