'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

export function PushNotificationGuide() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Recibí avisos de tus planificaciones y novedades de tu coach directamente en tu celular —
        aunque la app esté cerrada.
      </p>

      <Accordion type="single" collapsible className="w-full">
        {/* Android */}
        <AccordionItem value="android">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="text-base">🤖</span> Android
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 text-muted-foreground">
            <Step number={1} title="Instalá la app">
              Abrí Box Plan en <strong>Chrome</strong>, tocá el menú{' '}
              <strong>(⋮) → "Agregar a pantalla de inicio" → "Instalar"</strong>.
              <Note>Si ya tenés el ícono en tu pantalla de inicio, saltá este paso.</Note>
            </Step>

            <Step number={2} title="Activá las notificaciones">
              Dentro de la app andá a{' '}
              <strong>Perfil → Notificaciones</strong> y tocá{' '}
              <strong>"Activar notificaciones"</strong>. Aceptá el permiso cuando el celular te lo
              pida.
            </Step>

            <Step number={3} title="Permitir actividad en segundo plano">
              Para recibir notificaciones cuando la app está <strong>cerrada</strong>:
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Abrí los <strong>Ajustes</strong> de tu celular</li>
                <li>Entrá a <strong>Aplicaciones</strong></li>
                <li>Buscá y tocá <strong>Box Plan</strong></li>
                <li>Tocá <strong>Batería</strong></li>
                <li>Seleccioná <strong>"Sin restricciones"</strong></li>
              </ol>
            </Step>

            <Done />
          </AccordionContent>
        </AccordionItem>

        {/* iPhone */}
        <AccordionItem value="ios">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="text-base">🍎</span> iPhone / iPad{' '}
              <Badge variant="outline" className="text-xs font-normal">iOS 16.4+</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2 text-muted-foreground">
            <Step number={1} title="Abrí la app en Safari">
              Las notificaciones solo funcionan desde <strong>Safari</strong>. No uses Chrome ni
              otro navegador.
            </Step>

            <Step number={2} title="Agregá la app al inicio">
              Tocá el botón compartir <strong>(□↑)</strong> →{' '}
              <strong>"Agregar a pantalla de inicio"</strong> → <strong>"Agregar"</strong>.
            </Step>

            <Step number={3} title="Abrí la app desde el ícono">
              Cerrá Safari y abrí <strong>Box Plan desde el ícono</strong> en tu pantalla de inicio.
              <Note>
                Este paso es importante: si la abrís desde Safari, las notificaciones no funcionan.
              </Note>
            </Step>

            <Step number={4} title="Activá las notificaciones">
              Andá a <strong>Perfil → Notificaciones</strong> y tocá{' '}
              <strong>"Activar notificaciones"</strong>. Aceptá el permiso cuando aparezca.
            </Step>

            <Done />
          </AccordionContent>
        </AccordionItem>

        {/* Qué notificaciones */}
        <AccordionItem value="what">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="text-base">🔔</span> Qué notificaciones vas a recibir
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="rounded-lg border overflow-hidden text-muted-foreground">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-foreground">Notificación</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground">Cuándo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2">✅ Pago confirmado</td>
                    <td className="px-3 py-2">Cuando se confirma tu suscripción</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">📋 Nueva planificación</td>
                    <td className="px-3 py-2">Cuando tu coach publica la rutina del día</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">⚠️ Plan por vencer</td>
                    <td className="px-3 py-2">Días antes de que expire tu suscripción</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Problemas */}
        <AccordionItem value="issues">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="text-base">❓</span> ¿Las notificaciones no llegan?
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2 text-muted-foreground">
            <p>
              <strong className="text-foreground">En Android:</strong> verificá que en Ajustes →
              Aplicaciones → Box Plan → Batería esté en{' '}
              <strong>"Sin restricciones"</strong> y que las notificaciones estén habilitadas.
            </p>
            <p>
              <strong className="text-foreground">En iPhone:</strong> asegurate de abrir la app
              desde el ícono en el home screen (no desde Safari) y de tener iOS 16.4 o superior.
            </p>
            <p>
              <strong className="text-foreground">En ambos casos:</strong> entrá al perfil y
              verificá que el botón de notificaciones esté activo.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">
        {number}
      </span>
      <div>
        <p className="font-medium text-foreground mb-1">{title}</p>
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs bg-muted/50 border rounded px-3 py-2 text-muted-foreground">
      {children}
    </p>
  )
}

function Done() {
  return (
    <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
      ✅ Listo. A partir de ahora recibís notificaciones aunque la app esté cerrada.
    </p>
  )
}
