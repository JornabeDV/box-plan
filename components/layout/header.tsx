import { Target, LogIn, LogOut, Settings, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"
import Link from "next/link"

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, isAdmin, signOut } = useAuthWithRoles()

  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-background border-2 border-border rounded-full flex items-center justify-center">
              <Hash className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-lime-400 rounded-full animate-neon-pulse"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              CrossFit Pro
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
                variant="ghost"
                className="gap-1 md:gap-2 hover:bg-accent text-xs md:text-sm px-2 md:px-3 text-foreground"
              >
                <Settings className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}          

          {user && (
            <Button
              onClick={() => signOut()}
              variant="ghost"
              className="flex items-center gap-1 md:gap-2 p-2 md:px-3 hover:bg-accent text-foreground"
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