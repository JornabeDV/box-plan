import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Star, 
  Trophy, 
  Award, 
  Users 
} from "lucide-react"

/**
 * Componente TabsSection - Sección de pestañas del dashboard
 * Contiene las pestañas de Inicio, Calendario, Progreso y Comunidad
 */
export function TabsSection() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Inicio
        </TabsTrigger>
        <TabsTrigger
          value="calendar"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Calendario
        </TabsTrigger>
        <TabsTrigger
          value="progress"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Progreso
        </TabsTrigger>
        <TabsTrigger
          value="community"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Comunidad
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-8">
        {/* Contenido de la pestaña Inicio - vacío por ahora */}
      </TabsContent>

      <TabsContent value="calendar" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Enero 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-sm mb-4">
              <div className="font-semibold text-muted-foreground">L</div>
              <div className="font-semibold text-muted-foreground">M</div>
              <div className="font-semibold text-muted-foreground">X</div>
              <div className="font-semibold text-muted-foreground">J</div>
              <div className="font-semibold text-muted-foreground">V</div>
              <div className="font-semibold text-muted-foreground">S</div>
              <div className="font-semibold text-muted-foreground">D</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1
                const isToday = day === 15
                const hasWorkout = [13, 14, 15, 16, 17].includes(day)

                return (
                  <div
                    key={day}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer
                      ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                      ${hasWorkout && !isToday ? "bg-accent/20 text-accent font-semibold" : ""}
                      ${!hasWorkout && !isToday ? "hover:bg-muted" : ""}
                    `}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="progress" className="space-y-4 mt-6">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Records Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <div>
                  <p className="font-semibold">Deadlift</p>
                  <p className="text-sm text-muted-foreground">Hace 3 días</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">140kg</p>
                  <p className="text-xs text-primary">+5kg</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-card rounded-lg border">
                <div>
                  <p className="font-semibold">Back Squat</p>
                  <p className="text-sm text-muted-foreground">Hace 1 semana</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">120kg</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-card rounded-lg border">
                <div>
                  <p className="font-semibold">Fran</p>
                  <p className="text-sm text-muted-foreground">Hace 2 semanas</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">4:32</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-accent/10 rounded-lg border-l-4 border-primary">
                  <p className="text-2xl font-bold text-accent">18</p>
                  <p className="text-sm text-muted-foreground">Entrenamientos</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <p className="text-2xl font-bold text-secondary">3</p>
                  <p className="text-sm text-muted-foreground">Nuevos PRs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="community" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mensaje del Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="font-semibold text-primary mb-2">¡Excelente semana, equipo! 💪</p>
                <p className="text-sm text-muted-foreground">
                  Esta semana hemos visto grandes mejoras en técnica. Recuerden: la consistencia es clave. ¡Sigamos
                  así para la competencia del próximo mes!
                </p>
                <p className="text-xs text-muted-foreground mt-2">- Coach María</p>
              </div>

            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}