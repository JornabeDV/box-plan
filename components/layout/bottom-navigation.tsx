import { Button } from "@/components/ui/button"
import { User, Timer, Calculator, Settings } from "lucide-react"
import Link from "next/link"
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles"

export function BottomNavigation() {
  const { isAdmin } = useAuthWithRoles()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
      <div className="flex items-center justify-around py-3 px-2">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Perfil</span>
          </Button>
        </Link>
        
        <Link href="/timer">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
            <Timer className="w-5 h-5" />
            <span className="text-xs font-medium">Timer</span>
          </Button>
        </Link>
        
        <Link href="/rm-calculator">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
            <Calculator className="w-5 h-5" />
            <span className="text-xs font-medium">RM Calc</span>
          </Button>
        </Link>

        {isAdmin && (
          <Link href="/admin-dashboard">
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Admin</span>
            </Button>
          </Link>
        )}
      </div>
    </nav>
  )
}