import { Button } from "@/components/ui/button"
import { Calendar, Target, Plus, Trophy, Users, MessageCircle, CreditCard } from "lucide-react"
import Link from "next/link"

/**
 * Componente BottomNavigation - Navegación inferior fija
 * Contiene los botones de navegación principal de la aplicación
 */
export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
      <div className="flex items-center justify-around py-3 px-2">
        <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
          <Calendar className="w-5 h-5" />
          <span className="text-xs font-medium">Inicio</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
          <Target className="w-5 h-5" />
          <span className="text-xs font-medium">WODs</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 relative">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center -mt-3 shadow-xl shadow-primary/30 border-4 border-background">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-xs font-medium mt-1">Agregar</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-medium">Progreso</span>
        </Button>
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">Foro</span>
          </Button>
        </Link>
        <Link href="/subscription">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-3 px-4 hover:bg-primary/10">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">Suscripción</span>
          </Button>
        </Link>
      </div>
    </nav>
  )
}