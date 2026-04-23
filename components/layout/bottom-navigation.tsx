"use client";

import { memo, useMemo } from "react";
import { User, Timer, Calculator, Settings, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useStudentSubscription } from "@/hooks/use-student-subscription";

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] touch-manipulation">
      <div className="relative flex items-center justify-center">
        <Icon
          className={`w-5 h-5 transition-colors duration-200 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </div>
      <span
        className={`text-[10px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname();
  const { isAdmin, isCoach, isStudent } = useAuthWithRoles();
  const { canUseTimer, loading: subscriptionLoading } = useStudentSubscription();

  const showTimerButton = useMemo(() => {
    if (isCoach) return true;
    if (isStudent) return !subscriptionLoading && canUseTimer;
    return true;
  }, [subscriptionLoading, canUseTimer, isCoach, isStudent]);

  const showCoachDashboard = useMemo(() => isCoach, [isCoach]);
  const showAdminDashboard = useMemo(() => isAdmin && !isCoach, [isAdmin, isCoach]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-primary/10">
      <div className="flex items-center justify-around py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
        <NavItem
          href="/"
          icon={HomeIcon}
          label="Home"
          isActive={pathname === "/"}
        />
        <NavItem
          href="/profile"
          icon={User}
          label="Perfil"
          isActive={pathname === "/profile"}
        />
        {showTimerButton && (
          <NavItem
            href="/timer"
            icon={Timer}
            label="Timer"
            isActive={pathname === "/timer"}
          />
        )}
        <NavItem
          href="/log-rm"
          icon={Calculator}
          label="RM"
          isActive={pathname === "/log-rm"}
        />
        {showCoachDashboard && (
          <NavItem
            href="/admin-dashboard"
            icon={Settings}
            label="Dashboard"
            isActive={pathname === "/admin-dashboard"}
          />
        )}
        {showAdminDashboard && (
          <NavItem
            href="/admin-dashboard"
            icon={Settings}
            label="Admin"
            isActive={pathname === "/admin-dashboard"}
          />
        )}
      </div>
    </nav>
  );
});
