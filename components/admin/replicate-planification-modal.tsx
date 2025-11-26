'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Copy } from 'lucide-react'

interface ReplicatePlanificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (targetDate: Date, replaceExisting: boolean) => Promise<void>
  sourceDate: Date | null
  planificationCount: number
  loading?: boolean
}

export function ReplicatePlanificationModal({
  open,
  onOpenChange,
  onConfirm,
  sourceDate,
  planificationCount,
  loading = false
}: ReplicatePlanificationModalProps) {
  const [targetDate, setTargetDate] = useState<string>('')
  const [replaceExisting, setReplaceExisting] = useState<'add' | 'replace'>('add')

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async () => {
    if (!targetDate) return

    // Parsear la fecha manualmente para evitar problemas de zona horaria
    // El formato es YYYY-MM-DD
    const [year, month, day] = targetDate.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    await onConfirm(date, replaceExisting === 'replace')
    
    // Resetear formulario
    setTargetDate('')
    setReplaceExisting('add')
  }

  const handleQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setTargetDate(formatDate(date))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Replicar Planificaciones
          </DialogTitle>
          <DialogDescription>
            {planificationCount === 1 
              ? 'Duplicar esta planificación a otro día'
              : `Replicar ${planificationCount} planificaciones a otro día`
            }
            {sourceDate && (
              <span className="block mt-1 text-xs">
                Desde: {sourceDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de fecha */}
          <div className="space-y-2">
            <Label htmlFor="target-date">Fecha destino *</Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
            
            {/* Botones rápidos */}
            <div className="flex gap-2 flex-wrap mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(1)}
                className="text-xs"
              >
                Mañana
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(7)}
                className="text-xs"
              >
                En 7 días
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(14)}
                className="text-xs"
              >
                En 14 días
              </Button>
            </div>
          </div>

          {/* Opciones de replicación */}
          <div className="space-y-3">
            <Label>Opciones</Label>
            <RadioGroup value={replaceExisting} onValueChange={(value) => setReplaceExisting(value as 'add' | 'replace')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="font-normal cursor-pointer">
                  Agregar a fecha existente
                  <span className="block text-xs text-muted-foreground mt-1">
                    Las planificaciones se agregarán junto con las que ya existan
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="font-normal cursor-pointer">
                  Reemplazar planificaciones existentes
                  <span className="block text-xs text-muted-foreground mt-1">
                    Se eliminarán las planificaciones existentes antes de agregar las nuevas
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setTargetDate('')
              setReplaceExisting('add')
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !targetDate}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Replicando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Replicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}