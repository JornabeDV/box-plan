# Sistema de Features de Planes de Estudiantes

## Resumen de Implementación

Este documento describe cómo las features del plan del coach se mapean a las features disponibles en los planes de suscripción de los estudiantes.

---

## 🔄 MAPEO DE FEATURES

### Features del Coach → Features del Estudiante

| Feature del Coach (`CoachPlanType`) | Feature del Estudiante (`SubscriptionPlan`) | Descripción | Planes Coach |
|-------------------------------------|---------------------------------------------|-------------|--------------|
| `whatsapp_integration` | `whatsappSupport` | Soporte por WhatsApp | POWER, ELITE |
| `community_forum` | `communityAccess` | Acceso al foro/comunidad | POWER, ELITE |
| `score_loading` | `progressTracking` | Cargar scores/progreso | POWER, ELITE |
| `score_database` | `leaderboardAccess` | Ver ranking/leaderboard | POWER, ELITE |
| `timer` | `timerAccess` | Usar cronómetro en workouts | START, POWER, ELITE |
| `personalized_planifications` | `personalizedWorkouts` | Planes personalizados por alumno | ELITE |

### Features del Coach NO mapeadas (uso interno del coach)

| Feature | Uso | Razón |
|---------|-----|-------|
| `dashboard_custom` | Personalización visual del dashboard | Solo afecta la UI del coach |
| `mercadopago_connection` | Conectar cuenta de MercadoPago | Infraestructura de cobros |
| `custom_motivational_quotes` | Frases motivacionales personalizadas | El estudiante las ve pero no es configurable por plan |
| `replicate_planifications` | Duplicar planificaciones | Productividad del coach |
| `max_disciplines` | Límite de disciplinas | Se aplica a nivel de creación, no por plan de estudiante |
| `planification_access` | Acceso al calendario | Se hereda automáticamente en `planificationAccess` |

---

## 📁 ARCHIVOS MODIFICADOS/CREADOS

### Nuevos Archivos

1. **`lib/student-subscription-features.ts`**
   - Tipos y helpers para verificar features del estudiante
   - Funciones: `getStudentSubscription()`, `studentHasFeature()`, etc.

2. **`hooks/use-student-subscription.ts`**
   - Hook para React que expone las features del estudiante
   - Incluye caché local de 5 minutos

3. **`docs/STUDENT_PLAN_FEATURES.md`** (este archivo)
   - Documentación completa del sistema

### Archivos Modificados

1. **`components/coach/student-plan-form.tsx`**
   - Agregadas nuevas features: `timerAccess`, `personalizedWorkouts`
   - Removidas features no relacionadas: `videoLibrary`, `liveStreaming`, etc.

2. **`app/api/subscription-plans/route.ts`**
   - Validación de nuevas features al crear plan
   - Construcción correcta de `finalFeatures`

---

## 🎯 USO EN EL FRONTEND (Coach)

### Crear Plan para Estudiantes

```tsx
import { StudentPlanForm } from '@/components/coach/student-plan-form'

// El formulario automáticamente:
// 1. Lee las features del plan del coach
// 2. Muestra solo las features disponibles
// 3. Valida que no se ofrezca algo que no tiene
```

### Features en el Formulario

El coach puede activar/desactivar estas features para sus estudiantes:

- ✅ **WhatsApp** - Si el coach tiene `whatsapp_integration`
- ✅ **Comunidad** - Si el coach tiene `community_forum`
- ✅ **Progreso** - Si el coach tiene `score_loading`
- ✅ **Ranking** - Si el coach tiene `score_database`
- ✅ **Cronómetro** - Si el coach tiene `timer` (default: true)
- ✅ **Planificaciones Personalizadas** - Si el coach tiene `personalized_planifications`

---

## 👤 USO EN EL FRONTEND (Estudiante)

### Hook useStudentSubscription

```tsx
import { useStudentSubscription } from '@/hooks/use-student-subscription'

function StudentComponent() {
  const {
    subscription,
    loading,
    hasFeature,
    canViewRanking,
    canTrackProgress,
    canAccessCommunity,
    canUseWhatsAppSupport,
    canUseTimer,
    hasPersonalizedWorkouts,
    isSubscribed
  } = useStudentSubscription()

  if (loading) return <div>Cargando...</div>
  if (!isSubscribed) return <div>No tienes suscripción activa</div>

  return (
    <div>
      {canViewRanking && <RankingButton />}
      {canTrackProgress && <ProgressTracker />}
      {canAccessCommunity && <CommunityLink />}
      {canUseWhatsAppSupport && <WhatsAppButton />}
      {canUseTimer && <WorkoutTimer />}
    </div>
  )
}
```

---

## 🔒 VALIDACIÓN EN BACKEND

### Al Crear un Plan (POST /api/subscription-plans)

```typescript
// 1. Verificar que el coach no exceda maxStudentPlans

// 2. Validar tier solicitado vs maxStudentPlanTier

// 3. Validar cada feature solicitada:
if (features.whatsappSupport && !coachFeatures.whatsapp_integration) {
  throw new Error('No puedes ofrecer WhatsApp sin tenerlo en tu plan')
}

// 4. Construir features finales (AND lógico)
const finalFeatures = {
  whatsappSupport: coachFeatures.whatsapp_integration && features.whatsappSupport,
  communityAccess: coachFeatures.community_forum && features.communityAccess,
  progressTracking: coachFeatures.score_loading && features.progressTracking,
  leaderboardAccess: coachFeatures.score_database && features.leaderboardAccess,
  timerAccess: coachFeatures.timer && (features.timerAccess ?? true),
  personalizedWorkouts: coachFeatures.personalized_planifications && features.personalizedWorkouts,
}
```

### Al Verificar Acceso del Estudiante

```typescript
import { 
  canStudentViewRanking,
  canStudentTrackProgress,
  getStudentPlanificationAccess
} from '@/lib/student-subscription-features'

// En una API route
const canViewRanking = await canStudentViewRanking(studentId)
const planificationAccess = await getStudentPlanificationAccess(studentId)
```

---

## 📊 FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│  SUPERADMIN                                                     │
│  Crea planes de coach (START, POWER, ELITE)                    │
│  con features: whatsapp_integration, score_loading, etc.       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  COACH                                                          │
│  Contrata un plan (ej: POWER)                                   │
│  Obtiene: whatsapp_integration=true, score_loading=true, etc.  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  COACH - Crear Plan para Estudiantes                            │
│  Usa StudentPlanForm que lee sus features                       │
│  Puede ofrecer: WhatsApp, Comunidad, Progreso, Ranking         │
│  Crea plan: "Plan Pro" con whatsappSupport=true, etc.          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ESTUDIANTE                                                     │
│  Se suscribe a "Plan Pro"                                       │
│  Suscripción guarda features en JSONB                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ESTUDIANTE - Usa la App                                        │
│  useStudentSubscription() lee features de su suscripción        │
│  Ve/oculta funcionalidades según sus features                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

| Feature | Coach Form | API Validation | Student Hook | UI Implementation |
|---------|------------|----------------|--------------|-------------------|
| whatsappSupport | ✅ | ✅ | ✅ | Pendiente |
| communityAccess | ✅ | ✅ | ✅ | Pendiente |
| progressTracking | ✅ | ✅ | ✅ | Pendiente |
| leaderboardAccess | ✅ | ✅ | ✅ | Pendiente |
| timerAccess | ✅ | ✅ | ✅ | Pendiente |
| personalizedWorkouts | ✅ | ✅ | ✅ | Pendiente |

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar UI del estudiante** usando `useStudentSubscription()`
   - Ocultar/mostrar botón de Ranking
   - Ocultar/mostrar formulario de progreso
   - Ocultar/mostrar acceso a comunidad

2. **Validar acceso en APIs del estudiante**
   - Verificar feature antes de permitir guardar score
   - Verificar feature antes de mostrar ranking

3. **Agregar indicadores visuales**
   - Mostrar qué features incluye cada plan en la página de pricing
   - Badge "Incluido" / "No incluido" en el plan actual del estudiante
