import { Target, LogIn, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"
import Link from "next/link"

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, isAdmin, signOut } = useAuthWithRoles()

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
      <div className="relative flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text truncate">
              Bee Training
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {user ? `Hola, Jorge` : 'Tu entrenamiento de hoy'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {isAdmin && (
            <Link href="/admin-dashboard">
              <Button
                variant="default"
                size="sm"
                className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm px-2 md:px-3"
              >
                <Settings className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}          

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center gap-1 md:gap-2 p-2 md:px-3"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline text-xs md:text-sm">Salir</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}