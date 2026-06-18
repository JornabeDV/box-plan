# Prueba de concepto: Optimización de caché en Home de estudiante

## Objetivo

Reducir la cantidad de requests HTTP que se disparan al cargar la Home de un estudiante, mejorando el tiempo de carga percibido sin pagar servicios adicionales.

## Estado inicial

La Home montaba ~15-20 requests con muchos duplicados y cache-busting agresivo (`?_t=...`).

## Cambios implementados

### 1. Quick wins iniciales

- `Header` simplificado para no fetchear.
- Lock status movido al backend (`/api/user-preferences/[userId]`).
- Eliminado cache-busting en hooks estables.
- Agregados headers `Cache-Control` en endpoints estables.

### 2. Migración a React Query

Se instaló `@tanstack/react-query` y `@tanstack/react-query-devtools`.

Se creó `components/providers/query-provider.tsx` y se envolvió la app en `app/layout.tsx`.

Hooks migrados:
- `useUserDisciplines`
- `useStudentSubscription`
- `useAuthWithRoles`
- `useUserCoach`
- `useStudentCoach`
- `useCurrentUserPreferences`
- `useCoachMotivationalQuotes`
- `useProfile`
- `useAllTodayPlanifications`
- `useTodayPlanification`

### 3. Cacheo en servidor con `unstable_cache`

Endpoints cacheados:
- `/api/user-coach` → 5 minutos
- `/api/student/coach` → 5 minutos
- `/api/coaches/profile` → 5 minutos (con invalidación en PATCH)

## Resultado esperado

- Casi todos los requests de la Home sin timestamp.
- Menos requests duplicados gracias a la caché compartida de React Query.
- Menos consultas a Neon gracias a `unstable_cache` en catálogos estables.
- Mejor experiencia de carga para estudiantes.

## Limitación conocida

Neon en plan gratuito tiene cold starts. La optimización reduce drásticamente el impacto, pero no elimina completamente la lentitud si la base de datos está dormida.

## Próximos pasos

1. Probar en producción y medir requests/tiempos.
2. Agregar `unstable_cache` en más catálogos estables si es necesario:
   - `/api/disciplines`
   - `/api/exercises`
   - `/api/students/coach-motivational-quotes` (ya tiene Cache-Control, se puede reforzar)
   - `/api/subscription-plans`
3. Unificar `/api/user-coach` y `/api/student/coach` si aún coexisten.
4. Optimizar queries de Prisma en endpoints que siguen lentos.
