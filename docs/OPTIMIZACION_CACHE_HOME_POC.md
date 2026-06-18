# Prueba de concepto: Optimización de caché en Home de estudiante

## Objetivo

Reducir la cantidad de requests HTTP que se disparan al cargar la Home de un estudiante, mejorando el tiempo de carga percibido.

## Estado actual

La Home (`app/page.tsx`) monta simultáneamente varios hooks que hacen fetch:

| Hook | Endpoint | Observación |
|------|----------|-------------|
| `useAuthWithRoles` | `GET /api/user-role` | Usado en Home, Header, BottomNav |
| `useProfile` | `GET /api/profile`, `/api/subscription`, `/api/payment-history` | 3 requests en paralelo |
| `useUserCoach` | `GET /api/user-coach` | Coach asignado |
| `useStudentCoach` | `GET /api/student/coach` | Coach asignado (resumido) |
| `useStudentSubscription` | `GET /api/subscriptions/current` | Suscripción con features |
| `useCurrentUserPreferences` | `GET /api/user-preferences/{id}` | Preferencias + lock status |
| `useUserDisciplines` | `GET /api/user-disciplines` | Disciplinas del alumno |
| `useCoachMotivationalQuotes` | `GET /api/students/coach-motivational-quotes` | Frases del coach |

**Total estimado en carga inicial: 9-10 requests**, con muchos duplicados entre Header, BottomNavigation y Home.

## Cambios implementados

### 1. Simplificar `Header` para que no fetchee

`Header` ahora usa `useSession` de NextAuth en lugar de `useAuthWithRoles`, `useStudentSubscription` y `useUserCoach`.

**Archivo:** `components/layout/header.tsx`

### 2. Mover cálculo de `lockStatus` al backend

`GET /api/user-preferences/[userId]` ahora calcula y devuelve `lock_status` directamente, eliminando la llamada interna a `/api/subscription` desde el frontend.

**Archivos:**
- `app/api/user-preferences/[userId]/route.ts`
- `hooks/use-current-user-preferences.ts`

### 3. Eliminar cache-busting agresivo en datos estables

Se removieron los timestamps y headers anti-cache en:
- `useUserDisciplines`
- `useCoachMotivationalQuotes`
- `useCurrentUserPreferences`

### 4. Agregar `Cache-Control` en endpoints estables

- `GET /api/user-disciplines` → `private, max-age=60, stale-while-revalidate=300`
- `GET /api/students/coach-motivational-quotes` → `private, max-age=300, stale-while-revalidate=600`
- `GET /api/user-preferences/[userId]` → `private, max-age=60, stale-while-revalidate=300`

### 5. Migración a React Query (en progreso)

Se instaló `@tanstack/react-query` y `@tanstack/react-query-devtools`.

Se creó `components/providers/query-provider.tsx` y se envolvió la app en `app/layout.tsx`.

Hooks migrados:
- `useUserDisciplines`
- `useStudentSubscription`
- `useAuthWithRoles`

Esto permite que múltiples componentes compartan los mismos datos sin repetir requests.

## Hooks pendientes de migrar

- `useUserCoach`
- `useStudentCoach`
- `useCurrentUserPreferences`
- `useProfile`
- `useCoachMotivationalQuotes`

## Métricas de éxito

| Métrica | Antes | Objetivo |
|---------|-------|----------|
| Requests en carga inicial de Home | ~15-20 | ~6-8 |
| Requests repetidos por navegación (Header + BottomNav) | ~5-6 | ~0-1 |
| Datos duplicados (suscripción, coach, rol) | Múltiples llamadas | Una sola llamada compartida |

## Problema identificado adicional

Los endpoints en producción tardan entre 500 ms y 1.5 s, lo que sugiere que la base de datos Neon en plan gratuito sufre de cold starts. La reducción de requests mitiga este problema, pero no lo elimina completamente.

## Próximos pasos

1. Probar los cambios de React Query en producción.
2. Migrar los hooks restantes a React Query.
3. Unificar endpoints duplicados (`/api/user-coach` y `/api/student/coach`).
4. Agregar `unstable_cache` en catálogos estables del coach.
5. Evaluar optimizaciones de queries de Prisma en endpoints lentos.
