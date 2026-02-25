# Fix para Problemas de Caché y Loading en iOS/Safari

## Problemas Identificados

### 1. Bug de Loading Infinito para Coaches (CRÍTICO)
**Archivo:** `app/page.tsx` (línea 215)

El código tenía una condición que siempre era `true` para coaches autenticados:
```tsx
const isLoadingCriticalData =
    authLoading ||
    profileLoading ||
    subscriptionLoading ||
    preferencesLoading ||
    (shouldLoadTodayPlanification && todayPlanificationLoading) ||
    (isCoach && user?.id);  // <-- BUG: Siempre true para coaches!
```

**Solución:** Eliminar la condición `(isCoach && user?.id)`

### 2. Caché Agresivo en Safari/iOS
Safari en iOS cachea muy agresivamente las peticiones `fetch`, lo que puede causar:
- Datos desactualizados
- Problemas de autenticación
- Loading infinito al no actualizar el estado de sesión

**Solución:** Agregar timestamp y headers anti-caché a todas las peticiones fetch:
```typescript
const timestamp = Date.now();
const response = await fetch(`/api/endpoint?_t=${timestamp}`, {
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
    }
});
```

### 3. Falta de Manejo de Timeout
No había mecanismo para detectar cuando el loading llevaba demasiado tiempo.

**Solución:** Crear hook `useLoadingTimeout` que detecta loading infinito después de 15 segundos.

## Cambios Realizados

### Archivos Modificados:

1. **`app/page.tsx`**
   - Eliminada condición bug de loading para coaches
   - Agregado estado `isRedirectingCoach` para trackear redirección
   - Integrado hook `useLoadingTimeout` para detectar loading infinito
   - Agregada UI de timeout con opciones de reintentar

2. **`app/layout.tsx`**
   - Agregados meta tags anti-caché para iOS
   - Integrado componente `ClearCacheScript`
   - Mejorada configuración de PWA para iOS

3. **`hooks/use-auth-with-roles.ts`**
   - Agregado timestamp y headers anti-caché

4. **`hooks/use-profile.ts`**
   - Agregado timestamp y headers anti-caché a todos los endpoints

5. **`hooks/use-student-subscription.ts`**
   - Agregado timestamp y headers anti-caché

6. **`hooks/use-user-coach.ts`**
   - Agregado timestamp y headers anti-caché

7. **`hooks/use-student-coach.ts`**
   - Agregado timestamp y headers anti-caché

8. **`hooks/use-current-user-preferences.ts`**
   - Agregado timestamp y headers anti-caché

9. **`hooks/use-today-planification.ts`**
   - Agregado timestamp y headers anti-caché

10. **`hooks/use-coach-motivational-quotes.ts`**
    - Agregado manejo de sesión con `useSession`
    - Agregado timestamp y headers anti-caché
    - Mejorado manejo de errores 401

### Archivos Nuevos:

1. **`hooks/use-loading-timeout.ts`**
   - Hook para detectar loading infinito
   - Configurable con timeout personalizado
   - Callback opcional cuando ocurre timeout

2. **`components/clear-cache-script.tsx`**
   - Limpia caché de Service Workers
   - Detecta iOS/Safari y aplica fixes específicos
   - Utilidades `forceReloadWithoutCache()` y `clearAllAndReload()`

## Cómo Limpiar Caché en iOS

### Opción 1: URL con parámetro
Agregar `?clear_cache=1` a cualquier URL:
```
https://tusitio.com?clear_cache=1
```

### Opción 2: Botón de limpiar
La app ahora muestra un botón "Limpiar datos y volver a login" cuando hay timeout.

### Opción 3: Manualmente en iOS
1. Ir a Ajustes → Safari → Avanzado → Datos de sitios web
2. Buscar el dominio y deslizar para eliminar
3. O usar "Eliminar historial y datos de sitios web"

## Testing

Para verificar que los fixes funcionan:

1. **Login como coach:**
   - Debería redirigir a `/admin-dashboard` sin quedarse en loading

2. **En iOS Safari:**
   - Hacer login, cerrar pestaña, reabrir
   - No debería quedarse en loading infinito

3. **Simular timeout:**
   - Desconectar internet durante la carga
   - Debería mostrar UI de timeout después de 15 segundos

## Prevención Futura

1. Siempre usar el patrón de timestamp + headers anti-caché en fetch
2. Nunca agregar condiciones booleanas fijas en estados de loading
3. Implementar timeout en todas las pantallas críticas
4. Probar en Safari/iOS antes de deployar
