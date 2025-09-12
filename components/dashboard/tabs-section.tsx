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
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              Progreso Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Entrenamientos completados</span>
                <span className="text-xl font-bold text-primary">4/5</span>
              </div>
              <div className="space-y-2">
                <Progress value={80} className="h-3 bg-muted/50" />
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-sm font-bold text-primary-foreground">✓</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-sm font-bold text-primary-foreground">✓</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-sm font-bold text-primary-foreground">✓</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-sm font-bold text-primary-foreground">✓</span>
                </div>
                <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                  <span className="text-sm font-bold text-muted-foreground">?</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-accent-foreground" />
              </div>
              Logros Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent/10 to-transparent rounded-xl border border-accent/20">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-lg shadow-accent/25">
                  <Trophy className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Racha de 10 días</p>
                  <p className="text-sm text-muted-foreground">Desbloqueado hace 2 días</p>
                </div>
                <Badge variant="outline" className="border-accent/50 text-accent">
                  Nuevo
                </Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/10 to-transparent rounded-xl border border-secondary/20">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-lg shadow-secondary/25">
                  <Award className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">PR en Deadlift</p>
                  <p className="text-sm text-muted-foreground">140kg - Nuevo récord personal</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-secondary">+5kg</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

              <div className="space-y-3">
                <h4 className="font-semibold">Leaderboard Semanal</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-accent-foreground">1</span>
                      </div>
                      <span className="font-semibold">Carlos M.</span>
                    </div>
                    <span className="text-sm text-muted-foreground">5/5 WODs</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">2</span>
                      </div>
                      <span className="font-semibold">Ana L.</span>
                    </div>
                    <span className="text-sm text-muted-foreground">5/5 WODs</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">3</span>
                      </div>
                      <span className="font-semibold">Tú</span>
                    </div>
                    <span className="text-sm text-muted-foreground">4/5 WODs</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}