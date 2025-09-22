"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, Weight, Target } from "lucide-react"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

export default function RMCalculatorPage() {
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [oneRM, setOneRM] = useState<number | null>(null)
  const [percentages, setPercentages] = useState<{ percentage: number; weight: number }[]>([])

  const calculateOneRM = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    
    if (w && r && r > 0) {
      // Fórmula de Brzycki: 1RM = peso / (1.0278 - 0.0278 * reps)
      const calculatedOneRM = w / (1.0278 - 0.0278 * r)
      setOneRM(Math.round(calculatedOneRM * 10) / 10)
      
      // Calcular porcentajes del 1RM
      const percentagesArray = [50, 60, 70, 75, 80, 85, 90, 95, 100].map(p => ({
        percentage: p,
        weight: Math.round((calculatedOneRM * p / 100) * 10) / 10
      }))
      setPercentages(percentagesArray)
    }
  }

  const resetCalculator = () => {
    setWeight("")
    setReps("")
    setOneRM(null)
    setPercentages([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      <Header />
      
      <main className="p-6 space-y-6 pb-24">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading">Calculadora RM</h1>
          <p className="text-muted-foreground">Calcula tu repetición máxima</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Datos del Entrenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso levantado (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Ej: 80"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reps">Repeticiones realizadas</Label>
              <Input
                id="reps"
                type="number"
                placeholder="Ej: 5"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={calculateOneRM}
                className="flex-1"
                disabled={!weight || !reps}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular
              </Button>
              <Button
                onClick={resetCalculator}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {oneRM && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Tu 1RM Estimado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-primary mb-4">
                {oneRM} kg
              </div>
              <p className="text-sm text-muted-foreground">
                Basado en la fórmula de Brzycki
              </p>
            </CardContent>
          </Card>
        )}

        {percentages.length > 0 && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="w-6 h-6 text-primary" />
                Porcentajes de Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {percentages.map(({ percentage, weight }) => (
                  <div
                    key={percentage}
                    className={`p-2 rounded text-center ${
                      percentage === 100 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="font-medium">{percentage}%</div>
                    <div className="text-xs">{weight}kg</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Usa la fórmula de Brzycki para mayor precisión</p>
            <p>• Ideal para 1-10 repeticiones</p>
            <p>• Los porcentajes te ayudan a planificar entrenamientos</p>
            <p>• 100% = tu repetición máxima estimada</p>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  )
}