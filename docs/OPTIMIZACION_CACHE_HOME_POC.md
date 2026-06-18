# Prueba de concepto: Optimización de caché en Home de estudiante

## Objetivo

Reducir la cantidad de requests HTTP que se disparan al cargar la Home de un estudiante, mejorando el tiempo de carga percibido sin refactorizar toda la arquitectura.

## Estado actual

La Home (`app/page.tsx`) monta simultáneamente varios hooks que hacen fetch:

| Hook | Endpoint | Observación |
|------|----------|-------------|
| `useAuthWithRoles` | `GET /api/user-role?_t={ts}` | Necesario para rol, pero se repite en Header y BottomNav |
| `useProfile` | `GET /api/profile?_t={ts}` | Perfil + suscripción + historial de pagos |
| `useUserCoach` | `GET /api/user-coach?_t={ts}` | Coach asignado |
| `useStudentCoach` | `GET /api/student/coach?_t={ts}` | Coach asignado (resumido) |
| `useStudentSubscription` | `GET /api/subscriptions/current?_t={ts}` | Suscripción con features |
| `useCurrentUserPreferences` | `GET /api/user-preferences/{id}?_t={ts}` | Preferencias |
| `useCurrentUserPreferences` | `GET /api/subscription` | Lock status (llamada interna) |
| `useUserDisciplines` | `GET /api/user-disciplines?_t={ts}` | Disciplinas del alumno |
| `useCoachMotivationalQuotes` | `GET /api/students/coach-motivational-quotes?_t={ts}` | Frases del coach |

**Total estimado en carga inicial: 9-10 requests**, de los cuales varios son duplicados o innecesarios.

Además, `Header` y `BottomNavigation` repiten `useAuthWithRoles`, `useStudentSubscription` y `useUserCoach` en **cada navegación**.

## Problemas identificados

1. **Header fetchea datos que no usa**: solo necesita saber si hay sesión, pero dispara 3 requests.
2. **Lock status se calcula en cliente**: `useCurrentUserPreferences` llama a `/api/subscription` después de traer las preferencias.
3. **Cache-busting agresivo**: casi todos los hooks agregan `?_t={Date.now()}` y headers `Cache-Control: no-store`, anulando cualquier caché útil.
4. **Coach duplicado**: `useUserCoach` y `useStudentCoach` se usan juntos en Home.

## Cambios propuestos (prueba de concepto)

### 1. Simplificar `Header` para que no fetchee

Actualmente `Header` usa:
- `useAuthWithRoles` solo para `user`.
- `useStudentSubscription` solo para `loading` (no lo usa en el render).
- `useUserCoach()` con resultado ignorado.

**Cambio**: usar directamente `useSession` de NextAuth.

```tsx
import { useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()
  if (!session?.user) return null
  // ... resto del componente
}
```

**Impacto**: -3 requests por navegación.

### 2. Mover cálculo de `lockStatus` al backend

En `GET /api/user-preferences/[userId]` se consulta Prisma por la suscripción activa y se devuelve el lock status junto con las preferencias.

En `useCurrentUserPreferences` se elimina `calculateLockStatus` y la llamada interna a `/api/subscription`.

**Impacto**: -1 request en Home (y en cualquier pantalla que use preferencias).

### 3. Eliminar cache-busting en datos estables

En los siguientes hooks se remueve `?_t={Date.now()}` y los headers anti-cache:
- `useUserDisciplines`
- `useCoachMotivationalQuotes`

Se deja que el navegador respete los `Cache-Control` del servidor.

Para evitar datos stale tras mutaciones, `useUserDisciplines` y `useCurrentUserPreferences` reciben una opción `forceRefresh` que usa `cache: 'no-store'` en los `POST/PUT/DELETE`.

**Impacto**: permite reutilizar respuestas entre navegaciones y reduce carga de servidor.

### 4. Agregar caché en endpoints estables

En endpoints que devuelven datos de baja rotación se agrega `Cache-Control` adecuado:
- `GET /api/user-disciplines` → `private, max-age=60, stale-while-revalidate=300`
- `GET /api/students/coach-motivational-quotes` → `private, max-age=300, stale-while-revalidate=600`
- `GET /api/user-preferences/[userId]` → `private, max-age=60, stale-while-revalidate=300`

### 5. Evaluar unificación de coach en Home (opcional para esta PoC)

`useUserCoach` trae más datos (nombre, email, logo, etc.) y `useStudentCoach` trae versión resumida. Si la Home solo necesita la info completa, podría dejar de usar `useStudentCoach`. Esto se evalúa durante la implementación sin modificar los hooks subyacentes.

## Métricas de éxito

| Métrica | Antes | Objetivo |
|---------|-------|----------|
| Requests en carga inicial de Home | ~9-10 | ~5-6 |
| Requests repetidos por navegación (Header + BottomNav) | ~3-4 | ~0-1 |
| Tiempo hasta pantalla usable | baseline | reducir perceptiblemente |

## Alcance limitado (esta PoC)

- No se instala TanStack Query ni SWR.
- No se refactorizan Server Components.
- No se toca `useAuthWithRoles` globalmente (solo se saca del Header).
- No se modifica la planificación de hoy ni workouts (datos que deben seguir frescos).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Safari/iOS cachee datos que no debería | Se mantiene `no-store` solo en datos frescos; los estables ahora usan TTL controlado por servidor |
| Header deje de reaccionar a cambios de rol | El Header no renderiza nada basado en rol; solo necesita sesión |
| Lock status quede desactualizado | El backend recalcula en cada GET con la suscripción activa actual |
| BottomNav sigue fetcheando | Se deja para una segunda iteración; esta PoC se enfoca en Home + Header |

## Próximos pasos tras la PoC

1. Medir impacto real en producción o staging.
2. Replicar el patrón en otras pantallas (Profile, Calendar, Planification).
3. Evaluar introducción de un contexto global de usuario o TanStack Query si la navegación entre pantallas sigue siendo lenta.
4. Aplicar `unstable_cache` en catálogos del coach (disciplinas, ejercicios, frases).
