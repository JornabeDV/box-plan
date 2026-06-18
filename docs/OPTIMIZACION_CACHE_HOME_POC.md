# Prueba de concepto: Optimización de caché en Home de estudiante

## Objetivo

Reducir la cantidad de requests HTTP y mejorar los tiempos de carga de la Home de estudiante sin pagar servicios adicionales.

## Cambios implementados

### 1. Migración a React Query

Todos los hooks principales de la Home fueron migrados a `@tanstack/react-query`:

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

Esto eliminó los timestamps anti-cache y redujo los requests duplicados.

### 2. Cacheo en servidor con `unstable_cache`

Se creó `lib/cache/index.ts` con funciones cacheadas reutilizables.

Endpoints que ahora usan cacheo en servidor:
- `/api/user-role`
- `/api/profile`
- `/api/subscription`
- `/api/subscriptions/current`
- `/api/user-coach`
- `/api/student/coach`
- `/api/user-disciplines`
- `/api/user-preferences/[userId]`
- `/api/payment-history`
- `/api/coaches/profile`

Cada endpoint devuelve además headers `Cache-Control` adecuados para el navegador.

### 3. Endpoint consolidado `/api/home` (Opción 2)

Se creó `/api/home/route.ts` que devuelve en una sola llamada:
- rol y perfiles
- perfil del usuario
- suscripción actual
- coach asignado
- disciplinas
- preferencias

También se creó el hook `useHomeData` para consumir este endpoint.

## Resultado esperado

- Menos requests duplicados gracias a React Query.
- Respuestas cacheadas en Vercel para reducir consultas a Neon.
- Respuestas cacheadas en navegador para navegación entre pantallas.
- Endpoint opcional `/api/home` para futura consolidación de la carga inicial.

## Nota sobre `/api/home`

El endpoint y el hook están creados pero no integrados en `app/page.tsx` todavía. `page.tsx` tiene ~676 líneas y mucha lógica acoplada a los hooks individuales. Integrar `/api/home` requiere una refactorización más profunda que se recomienda hacer en un paso separado, probando bien cada parte.

## Próximos pasos

1. Probar en producción los cambios de cacheo en endpoints individuales.
2. Evaluar si es necesario integrar `/api/home` en `page.tsx` o si el cacheo actual es suficiente.
3. Agregar `unstable_cache` en catálogos del coach si siguen siendo lentos.
4. Optimizar queries de Prisma en endpoints que aún tarden mucho.
