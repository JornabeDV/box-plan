import { Target, Flame, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

interface HeaderProps {
  currentStreak: number
}

/**
 * Componente Header - Barra superior de la aplicación
 * Muestra el logo, título y racha actual del usuario
 */
export function Header({ currentStreak }: HeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
      <div className="relative flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              CrossFit Pro
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Hola, ${user.email}` : 'Tu entrenamiento de hoy'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20">
                <Flame className="w-5 h-5 text-secondary animate-pulse" />
                <div className="text-right">
                  <span className="text-lg font-bold text-secondary-foreground">{currentStreak}</span>
                  <p className="text-xs text-secondary-foreground/80">días</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20">
              <Flame className="w-5 h-5 text-secondary animate-pulse" />
              <div className="text-right">
                <span className="text-lg font-bold text-secondary-foreground">{currentStreak}</span>
                <p className="text-xs text-secondary-foreground/80">días</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}