"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, RotateCcw, Clock, Timer, Zap, Target, Repeat, Bell } from "lucide-react"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

type TimerMode = 'normal' | 'tabata' | 'fortime' | 'amrap' | 'emom' | 'otm'

export default function TimerPage() {
  const [mode, setMode] = useState<TimerMode>('normal')
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState("8")
  const [workTime, setWorkTime] = useState("20")
  const [restTime, setRestTime] = useState("10")
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const modeConfigs = {
    normal: { name: 'Cronómetro Normal', icon: Clock, description: 'Cronómetro básico' },
    tabata: { name: 'TABATA', icon: Zap, description: '20s trabajo / 10s descanso' },
    fortime: { name: 'FOR TIME', icon: Timer, description: 'Completar en el menor tiempo' },
    amrap: { name: 'AMRAP', icon: Target, description: 'Máximas rondas posibles' },
    emom: { name: 'EMOM', icon: Bell, description: 'Cada minuto en el minuto' },
    otm: { name: 'OTM', icon: Repeat, description: 'Cada minuto en el minuto' }
  }

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1
          
          if (mode === 'tabata') {
            const workTimeNum = parseInt(workTime) || 20
            const restTimeNum = parseInt(restTime) || 10
            const totalWorkRest = workTimeNum + restTimeNum
            const cycleTime = newTime % totalWorkRest
            
            if (cycleTime === 0 && newTime > 0) {
              setIsWorkPhase(!isWorkPhase)
              
              if (isWorkPhase) {
                setCurrentRound(prev => {
                  const newRound = prev + 1
                  const totalRoundsNum = parseInt(totalRounds) || 8
                  if (newRound > totalRoundsNum) {
                    setIsRunning(false)
                    return prev
                  }
                  return newRound
                })
              }
            }
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, mode, workTime, restTime, totalRounds, isWorkPhase])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentPhaseTime = () => {
    if (mode === 'tabata') {
      const workTimeNum = parseInt(workTime) || 20
      const restTimeNum = parseInt(restTime) || 10
      const totalWorkRest = workTimeNum + restTimeNum
      const cycleTime = time % totalWorkRest
      return isWorkPhase ? workTimeNum - cycleTime : restTimeNum - cycleTime
    }
    return time
  }

  const getDisplayTime = () => {
    if (mode === 'tabata') {
      return formatTime(getCurrentPhaseTime())
    }
    return formatTime(time)
  }

  const getPhaseText = () => {
    if (mode === 'tabata') {
      return isWorkPhase ? 'TRABAJO' : 'DESCANSO'
    }
    return 'TIEMPO'
  }

  const getPhaseColor = () => {
    if (mode === 'tabata') {
      return isWorkPhase ? 'text-primary' : 'text-secondary'
    }
    return 'text-primary'
  }

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }


  const handleReset = () => {
    setTime(0)
    setIsRunning(false)
    setIsPaused(false)
    setCurrentRound(1)
    setIsWorkPhase(true)
    setWorkTime("20")
    setRestTime("10")
    setTotalRounds("8")
  }

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode)
    handleReset()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      <Header />
      
      <main className="p-6 space-y-6 pb-24">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading">Timer CrossFit</h1>
          <p className="text-muted-foreground">Herramientas de entrenamiento especializadas</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Tipo de Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modeConfigs).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {modeConfigs[mode].description}
            </p>
          </CardContent>
        </Card>

        {mode === 'tabata' && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Configuración TABATA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workTime">Trabajo (seg)</Label>
                  <Input
                    id="workTime"
                    type="number"
                    value={workTime}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (value.length <= 3 && parseInt(value) <= 999)) {
                        setWorkTime(value)
                      }
                    }}
                    min="1"
                    max="999"
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restTime">Descanso (seg)</Label>
                  <Input
                    id="restTime"
                    type="number"
                    value={restTime}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (value.length <= 3 && parseInt(value) <= 999)) {
                        setRestTime(value)
                      }
                    }}
                    min="1"
                    max="999"
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalRounds">Rondas</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  value={totalRounds}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || (value.length <= 2 && parseInt(value) <= 99)) {
                      setTotalRounds(value)
                    }
                  }}
                  min="1"
                  max="20"
                  placeholder="8"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {mode === 'normal' && <Clock className="w-6 h-6 text-primary" />}
              {mode === 'tabata' && <Zap className="w-6 h-6 text-primary" />}
              {mode === 'fortime' && <Timer className="w-6 h-6 text-primary" />}
              {mode === 'amrap' && <Target className="w-6 h-6 text-primary" />}
              {mode === 'emom' && <Bell className="w-6 h-6 text-primary" />}
              {mode === 'otm' && <Repeat className="w-6 h-6 text-primary" />}
              {modeConfigs[mode].name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {mode === 'tabata' && (
              <div className="text-lg font-medium">
                Ronda {currentRound} de {totalRounds}
              </div>
            )}
            
            {mode === 'tabata' && (
              <div className={`text-xl font-bold ${getPhaseColor()}`}>
                {getPhaseText()}
              </div>
            )}
            
            <div className={`text-6xl font-mono font-bold ${getPhaseColor()}`}>
              {getDisplayTime()}
            </div>
            
            <div className="flex justify-center gap-3">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  size="lg"
                  variant="outline"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </>
                  )}
                </Button>
              )}
              
              
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Información del Modo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {mode === 'normal' && (
              <>
                <p>• Cronómetro básico para medir tiempo</p>
                <p>• Ideal para entrenamientos con tiempo límite</p>
                <p>• Pausa y reanuda cuando necesites</p>
              </>
            )}
            {mode === 'tabata' && (
              <>
                <p>• 20 segundos de trabajo intenso</p>
                <p>• 10 segundos de descanso</p>
                <p>• 8 rondas completas</p>
                <p>• Total: 4 minutos de entrenamiento</p>
              </>
            )}
            {mode === 'fortime' && (
              <>
                <p>• Completa el entrenamiento en el menor tiempo</p>
                <p>• Cronómetro cuenta hacia arriba</p>
                <p>• Registra tu mejor tiempo</p>
              </>
            )}
            {mode === 'amrap' && (
              <>
                <p>• Máximas rondas posibles en el tiempo dado</p>
                <p>• Cronómetro cuenta hacia abajo</p>
                <p>• Intensidad máxima</p>
              </>
            )}
            {mode === 'emom' && (
              <>
                <p>• Cada minuto en el minuto</p>
                <p>• Ejercicio al inicio de cada minuto</p>
                <p>• Descansa el tiempo restante</p>
              </>
            )}
            {mode === 'otm' && (
              <>
                <p>• Cada minuto en el minuto</p>
                <p>• Similar a EMOM</p>
                <p>• Estructura de tiempo fija</p>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  )
}