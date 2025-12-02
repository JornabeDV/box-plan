import { Target, LogIn, LogOut, Settings, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useUserCoach } from "@/hooks/use-user-coach";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, isAdmin, isCoach, signOut } = useAuthWithRoles();
  const { coach } = useUserCoach();

  return (
    <header className="sticky top-0 z-50 bg-muted/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-lime-400/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Logo container - Mostrar logo del coach si existe, sino logo genérico */}
            {coach?.logoUrl ? (
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border-2 border-lime-400/30 bg-background shadow-lg shadow-lime-400/10 group-hover:shadow-lime-400/20 transition-all duration-300">
                <Image
                  src={coach.logoUrl}
                  alt={coach.businessName || coach.name}
                  fill
                  className="object-contain p-1"
                  onError={() => {
                    // Si falla el logo, no hacer nada (se mantendrá el contenedor vacío)
                  }}
                />
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-lime-400/30 rounded-2xl p-2 shadow-lg shadow-lime-400/10 group-hover:shadow-lime-400/20 transition-all duration-300">
                <Hash className="w-5 h-5 md:w-6 md:h-6 text-lime-400" />
              </div>
            )}

            {/* Pulse indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-lime-400 to-green-500 rounded-full shadow-[0_0_10px_rgba(204,255,0,0.6)] animate-pulse"></div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-display text-foreground truncate tracking-wide">
              Box Plan
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {user?.name ? `Hola, ${user.name}` : "Tu entrenamiento de hoy"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isCoach && (
            <Link href="/admin-dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 md:gap-2 hover:bg-white/5 hover:text-lime-400 transition-colors rounded-xl touch-manipulation"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline text-xs md:text-sm font-semibold">
                  Dashboard
                </span>
              </Button>
            </Link>
          )}

          {isAdmin && !isCoach && (
            <Link href="/admin-dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 md:gap-2 hover:bg-white/5 hover:text-lime-400 transition-colors rounded-xl touch-manipulation"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline text-xs md:text-sm font-semibold">
                  Admin
                </span>
              </Button>
            </Link>
          )}

          {user && (
            <Button
              onClick={() => signOut()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 md:gap-2 hover:bg-white/5 hover:text-red-400 transition-colors rounded-xl touch-manipulation"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-xs md:text-sm font-semibold">
                Salir
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
