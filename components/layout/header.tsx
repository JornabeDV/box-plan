import { Target, LogIn, LogOut, CreditCard, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"
import Link from "next/link"

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, isAdmin, signOut } = useAuthWithRoles()

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
              Bee Training
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Hola, Jorge` : 'Tu entrenamiento de hoy'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Planes
            </Button>
          </Link>
          
          {isAdmin && (
            <Link href="/admin-dashboard">
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            </Link>
          )}          
          
          {user && (
            <>
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}