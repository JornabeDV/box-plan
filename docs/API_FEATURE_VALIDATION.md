# Validación de Features en APIs (Backend)

## Resumen

Todas las APIs que exponen funcionalidades de pago ahora validan que el estudiante tenga la feature correspondiente en su plan de suscripción antes de procesar la request.

---

## 📋 APIs Protegidas

### 1. POST /api/workouts
**Feature requerida:** `score_loading` (progressTracking)

**Descripción:** Registro de workouts/scores del estudiante

**Validación:**
```typescript
const guard = await requireProgressTracking(userId)
if (!guard.allowed && guard.response) {
  return guard.response
}
```

**Error 403:**
```json
{
  "error": "Tu plan no incluye la funcionalidad de registro de scores y seguimiento de progreso.",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "score_loading"
}
```

---

### 2. PUT /api/user-progress
**Feature requerida:** `score_loading` (progressTracking)

**Descripción:** Actualización de progreso del usuario

**Validación:**
```typescript
const guard = await requireProgressTracking(userId)
if (!guard.allowed && guard.response) {
  return guard.response
}
```

**Error 403:**
```json
{
  "error": "Tu plan no incluye la funcionalidad de registro de scores y seguimiento de progreso.",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "score_loading"
}
```

---

### 3. GET /api/workouts/ranking
**Feature requerida:** `score_database` (leaderboardAccess)

**Descripción:** Obtener rankings de workouts

**Validación:**
```typescript
const guard = await requireRankingAccess(userId)
if (!guard.allowed && guard.response) {
  return guard.response
}
```

**Error 403:**
```json
{
  "error": "Tu plan no incluye la funcionalidad de ranking y base de datos de scores.",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "score_database"
}
```

---

### 4. POST /api/rms
**Feature requerida:** `score_loading` (progressTracking)

**Descripción:** Registro de Repeticiones Máximas (RM)

**Validación:**
```typescript
const guard = await requireProgressTracking(userId)
if (!guard.allowed && guard.response) {
  return guard.response
}
```

**Error 403:**
```json
{
  "error": "Tu plan no incluye la funcionalidad de registro de scores y seguimiento de progreso.",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "score_loading"
}
```

---

## 🛡️ Sistema de Guards

### Archivo: `lib/api-feature-guards.ts`

Funciones exportadas para validar acceso:

```typescript
// Verificar feature genérica
requireFeature(userId, feature, featureName)

// Verificaciones específicas
requireProgressTracking(userId)      // score_loading
requireRankingAccess(userId)          // score_database
requireCommunityAccess(userId)        // community_forum
requireWhatsAppAccess(userId)         // whatsapp_integration
requireTimerAccess(userId)            // timer
requirePersonalizedPlanifications(userId)  // personalized_planifications
```

### Respuesta del Guard

```typescript
interface FeatureGuardResult {
  allowed: boolean
  response?: NextResponse  // Presente solo si allowed=false
}
```

### Uso en APIs

```typescript
import { requireRankingAccess } from '@/lib/api-feature-guards'

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromSession()
  
  // Verificar feature
  const guard = await requireRankingAccess(userId)
  if (!guard.allowed && guard.response) {
    return guard.response
  }
  
  // Continuar con la lógica de la API...
}
```

---

## 📝 Códigos de Error

| Código | Descripción |
|--------|-------------|
| `FEATURE_NOT_AVAILABLE` | El usuario no tiene la feature requerida en su plan |

### Estructura del Error

```json
{
  "error": "Mensaje descriptivo",
  "code": "FEATURE_NOT_AVAILABLE",
  "feature": "nombre_de_la_feature"
}
```

---

## 🔄 Flujo de Validación

```
1. Usuario hace request a API protegida
           │
           ▼
2. API extrae userId del session/token
           │
           ▼
3. API llama a requireXxxAccess(userId)
           │
           ▼
4. Guard verifica en CoachPlanType.features
   (a través de la suscripción del estudiante)
           │
           ├── Feature NO disponible ──► Retorna 403
           │
           └── Feature disponible ─────► Continúa con la API
```

---

## 🚨 Manejo de Errores

### Error en la Validación
Si ocurre un error técnico al verificar la feature (no un 403 legítimo):

```typescript
try {
  const hasAccess = await studentHasFeature(userId, feature)
  // ...
} catch (error) {
  // Loguear error pero permitir acceso
  // para no bloquear al usuario por problemas técnicos
  console.error('Error al validar feature:', error)
  return { allowed: true }
}
```

**Razón:** Es mejor permitir acceso temporalmente por un error técnico que bloquear a usuarios legítimos.

---

## 📊 Matriz de Features vs APIs

| Feature | APIs Protegidas | Estado |
|---------|-----------------|--------|
| `score_loading` (progressTracking) | POST /api/workouts, PUT /api/user-progress, POST /api/rms | ✅ Implementado |
| `score_database` (leaderboardAccess) | GET /api/workouts/ranking | ✅ Implementado |
| `whatsapp_integration` (whatsappSupport) | N/A (solo frontend) | ✅ N/A |
| `community_forum` (communityAccess) | Pendiente (API de comunidad no existe) | ⏳ Esperando API |
| `timer` (timerAccess) | N/A (solo frontend) | ✅ N/A |
| `personalized_planifications` (personalizedWorkouts) | N/A (heredado del coach) | ✅ N/A |

---

## 🧪 Testing

### Ejemplo de Test para API Protegida

```typescript
// __tests__/api/workouts.test.ts
describe('POST /api/workouts', () => {
  it('should return 403 if user does not have progressTracking feature', async () => {
    // Setup: Usuario sin feature
    const user = await createUserWithoutFeature('score_loading')
    
    // Request
    const response = await fetch('/api/workouts', {
      method: 'POST',
      body: JSON.stringify({
        planification_id: 1,
        data: { type: 'wod_score' }
      })
    })
    
    // Assert
    expect(response.status).toBe(403)
    const json = await response.json()
    expect(json.code).toBe('FEATURE_NOT_AVAILABLE')
    expect(json.feature).toBe('score_loading')
  })
  
  it('should create workout if user has progressTracking feature', async () => {
    // Setup: Usuario con feature
    const user = await createUserWithFeature('score_loading')
    
    // Request
    const response = await fetch('/api/workouts', {
      method: 'POST',
      body: JSON.stringify({
        planification_id: 1,
        data: { type: 'wod_score' }
      })
    })
    
    // Assert
    expect(response.status).toBe(200)
  })
})
```

---

## 🚀 Agregar Validación a Nueva API

Para proteger una nueva API con validación de features:

1. **Importar el guard:**
```typescript
import { requireXxxAccess } from '@/lib/api-feature-guards'
```

2. **Validar al inicio del handler:**
```typescript
const guard = await requireXxxAccess(userId)
if (!guard.allowed && guard.response) {
  return guard.response
}
```

3. **Continuar con la lógica:**
```typescript
// El usuario tiene acceso, continuar...
```

---

## ⚠️ Notas Importantes

1. **Siempre validar en el backend:** El frontend puede ser bypassed, nunca confiar solo en validaciones de UI.

2. **Validar antes de cualquier operación:** La validación debe ser lo primero que se hace en la API, antes de leer el body o hacer queries.

3. **Errores descriptivos:** Los mensajes de error deben ser claros para que el usuario sepa qué feature necesita.

4. **Logging:** Los errores de validación se loguean para debugging, pero no se exponen detalles internos al cliente.
