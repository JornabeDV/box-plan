import { Button } from "@/components/ui/button"
import { User, Timer, Calculator, Settings, Hash } from "lucide-react"
import Link from "next/link"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"

export function BottomNavigation() {
  const { isAdmin } = useAuthWithRoles()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-3 px-2">

        <Link href="/">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-accent text-foreground">
            <Calculator className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Button>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-1 py-3 px-4 hover:bg-accent rounded-lg transition-colors">
          <User className="w-5 h-5 text-foreground" />
          <span className="text-xs font-medium text-foreground">Perfil</span>
        </Link>
        
        <Link href="/timer">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-accent text-foreground">
            <Timer className="w-5 h-5" />
            <span className="text-xs font-medium">Timer</span>
          </Button>
        </Link>
        
        <Link href="/rm-calculator">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-accent text-foreground">
            <Calculator className="w-5 h-5" />
            <span className="text-xs font-medium">RM</span>
          </Button>
        </Link>

        {isAdmin && (
          <Link href="/admin-dashboard">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-accent text-foreground">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Admin</span>
            </Button>
          </Link>
        )}
      </div>
    </nav>
  )
}