# Sistema de Funcionalidades según Plan del Coach

Este documento explica cómo funciona el sistema de validación de funcionalidades según el plan que tiene contratado el coach.

## Estructura

### Planes Disponibles

1. **Plan START**
   - Hasta 10 alumnos
   - Comisión 5%
   - Dashboard personalizado
   - Planificación diaria (1 semana para cargar)
   - Hasta 2 disciplinas
   - Cronómetro

2. **Plan POWER**
   - Hasta 30 alumnos
   - Comisión 3%
   - Dashboard personalizado
   - Planificación diaria con cargas mensuales
   - Carga de score por alumno
   - Base de datos de scores
   - Hasta 3 disciplinas
   - Conexión con MercadoPago
   - Vinculación con WhatsApp
   - Foro para comunidad
   - Cronómetro

3. **Plan ELITE**
   - Alumnos ilimitados
   - Comisión 2%
   - Dashboard personalizado
   - Planificación diaria con cargas sin límite
   - Carga de score por alumno
   - Base de datos de scores
   - Disciplinas ilimitadas
   - Conexión con billetera virtual
   - Vinculación con WhatsApp
   - Foro para comunidad
   - Cronómetro

## Uso en Backend (APIs)

### Ejemplo: Validar límite de disciplinas al crear planificación

```typescript
import { getCoachMaxDisciplines } from '@/lib/coach-plan-features'

// En tu API route
const coachId = authCheck.profile.id

// Verificar límite de disciplinas
const maxDisciplines = await getCoachMaxDisciplines(coachId)
const currentDisciplines = await prisma.planification.findMany({
  where: { coachId },
  select: { disciplineId: true },
  distinct: ['disciplineId']
})

if (currentDisciplines.length >= maxDisciplines && !currentDisciplines.some(d => d.disciplineId === disciplineIdNum)) {
  return NextResponse.json(
    { error: `Has alcanzado el límite de ${maxDisciplines} disciplinas de tu plan` },
    { status: 403 }
  )
}
```

### Ejemplo: Validar límite de semanas para cargar planificaciones (Plan START)

```typescript
import { getCoachPlanificationWeeks, canCoachLoadMonthlyPlanifications } from '@/lib/coach-plan-features'

const coachId = authCheck.profile.id
const planificationWeeks = await getCoachPlanificationWeeks(coachId)

if (planificationWeeks > 0) {
  // Plan START: solo puede cargar hasta X semanas adelante
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + (planificationWeeks * 7))
  
  if (new Date(body.date) > maxDate) {
    return NextResponse.json(
      { error: `Tu plan solo permite cargar planificaciones hasta ${planificationWeeks} semana(s) adelante` },
      { status: 403 }
    )
  }
} else if (!(await canCoachLoadMonthlyPlanifications(coachId))) {
  // Si no tiene planificación mensual ni ilimitada, solo puede cargar para hoy
  const today = new Date()
  const planificationDate = new Date(body.date)
  
  if (planificationDate.toDateString() !== today.toDateString()) {
    return NextResponse.json(
      { error: 'Tu plan solo permite cargar planificaciones para el día actual' },
      { status: 403 }
    )
  }
}
```

### Ejemplo: Validar acceso a funcionalidades específicas

```typescript
import { 
  canCoachLoadScores, 
  canCoachUseMercadoPago,
  canCoachUseWhatsApp,
  canCoachUseCommunityForum 
} from '@/lib/coach-plan-features'

// Validar carga de scores
if (!(await canCoachLoadScores(coachId))) {
  return NextResponse.json(
    { error: 'Tu plan no incluye la funcionalidad de carga de scores' },
    { status: 403 }
  )
}

// Validar uso de MercadoPago
if (!(await canCoachUseMercadoPago(coachId))) {
  return NextResponse.json(
    { error: 'Tu plan no incluye conexión con MercadoPago' },
    { status: 403 }
  )
}
```

## Uso en Frontend (React)

### Hook useCoachPlanFeatures

```typescript
import { useCoachPlanFeatures } from '@/hooks/use-coach-plan-features'

function MyComponent() {
  const {
    planInfo,
    loading,
    hasFeature,
    maxDisciplines,
    canLoadMonthlyPlanifications,
    canLoadUnlimitedPlanifications,
    canUseMercadoPago,
    canUseWhatsApp,
    canLoadScores
  } = useCoachPlanFeatures()

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h2>Plan: {planInfo?.displayName}</h2>
      
      {canLoadMonthlyPlanifications && (
        <button>Cargar Planificación Mensual</button>
      )}
      
      {canUseMercadoPago && (
        <button>Conectar MercadoPago</button>
      )}
      
      {canLoadScores && (
        <button>Cargar Score</button>
      )}
      
      <p>Disciplinas máximas: {maxDisciplines}</p>
    </div>
  )
}
```

### Validación condicional de UI

```typescript
const { hasFeature, maxDisciplines } = useCoachPlanFeatures()

// Mostrar/ocultar botones según el plan
{hasFeature('score_loading') && (
  <Button onClick={handleLoadScore}>
    Cargar Score
  </Button>
)}

// Validar antes de permitir acción
const handleAddDiscipline = () => {
  if (currentDisciplines.length >= maxDisciplines) {
    toast.error(`Has alcanzado el límite de ${maxDisciplines} disciplinas`)
    return
  }
  // ... continuar con la acción
}
```

## Funciones Disponibles

### Backend (`lib/coach-plan-features.ts`)

- `getCoachActivePlan(coachId)` - Obtiene el plan activo del coach
- `getStudentCoachPlan(studentId)` - Obtiene el plan del coach de un estudiante
- `coachHasFeature(coachId, feature)` - Verifica si el coach tiene una funcionalidad
- `studentHasFeature(studentId, feature)` - Verifica si un estudiante tiene acceso a una funcionalidad
- `getCoachMaxDisciplines(coachId)` - Obtiene el límite de disciplinas
- `canCoachLoadMonthlyPlanifications(coachId)` - Verifica si puede cargar mensualmente
- `canCoachLoadUnlimitedPlanifications(coachId)` - Verifica si puede cargar sin límite
- `getCoachPlanificationWeeks(coachId)` - Obtiene semanas permitidas (START)
- `canCoachUseMercadoPago(coachId)` - Verifica acceso a MercadoPago
- `canCoachUseWhatsApp(coachId)` - Verifica acceso a WhatsApp
- `canCoachUseCommunityForum(coachId)` - Verifica acceso a foro
- `canCoachLoadScores(coachId)` - Verifica si puede cargar scores
- `canCoachAccessScoreDatabase(coachId)` - Verifica acceso a BD de scores

### Frontend (`hooks/use-coach-plan-features.ts`)

- `planInfo` - Información completa del plan
- `hasFeature(feature)` - Verifica si tiene una funcionalidad
- `maxDisciplines` - Límite de disciplinas
- `canLoadMonthlyPlanifications` - Puede cargar mensualmente
- `canLoadUnlimitedPlanifications` - Puede cargar sin límite
- `planificationWeeks` - Semanas permitidas
- `canUseMercadoPago` - Puede usar MercadoPago
- `canUseVirtualWallet` - Puede usar billetera virtual
- `canUseWhatsApp` - Puede usar WhatsApp
- `canUseCommunityForum` - Puede usar foro
- `canLoadScores` - Puede cargar scores
- `canAccessScoreDatabase` - Puede acceder a BD de scores

## API Endpoint

### GET `/api/coaches/plan-features`

Obtiene las funcionalidades del plan del coach (o del coach del estudiante si es estudiante).

**Respuesta:**
```json
{
  "planInfo": {
    "planId": 1,
    "planName": "start",
    "displayName": "Plan Start",
    "features": {
      "dashboard_custom": true,
      "daily_planification": true,
      "planification_weeks": 1,
      "max_disciplines": 2,
      "timer": true
    },
    "maxStudents": 10,
    "commissionRate": 5,
    "isActive": true,
    "isTrial": false
  }
}
```

## Notas Importantes

1. **Período de Prueba**: Los coaches en período de prueba tienen acceso al Plan START por defecto
2. **Estudiantes**: Los estudiantes heredan las funcionalidades del plan de su coach
3. **Validación**: Siempre validar en el backend, el frontend solo para UX
4. **Caché**: Considerar caché para reducir queries repetidas en producción

