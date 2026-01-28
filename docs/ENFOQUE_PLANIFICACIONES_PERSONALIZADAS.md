# Enfoque Completo: Planificaciones Personalizadas

## 📋 Resumen del Sistema Actual

### Cómo funcionan las planificaciones actuales (Generales/Grupales):
1. **Coach crea una planificación** con:
   - Disciplina (ej: "Crossfit")
   - Nivel (ej: "Intermedio")
   - Fecha
   - Ejercicios/bloques

2. **Estudiantes ven planificaciones** basado en:
   - Sus preferencias de disciplina y nivel
   - La fecha seleccionada
   - **TODOS los estudiantes con la misma disciplina/nivel ven la misma planificación**

3. **Problema**: No hay forma de crear una planificación para UN solo estudiante específico

---

## 🎯 Objetivo: Planificaciones Personalizadas

### ¿Qué son?
- Planificaciones creadas específicamente para **UN estudiante**
- Solo ese estudiante puede verlas
- Tienen prioridad sobre las planificaciones generales

### Casos de uso:
1. Estudiante con necesidades especiales (lesión, embarazo, etc.)
2. Estudiante con objetivos específicos (competencia, evento)
3. Estudiante que paga por planificación 100% personalizada
4. Plan de progresión individual

---

## 🗄️ FASE 1: Cambios en Base de Datos

### 1.1 Modificar tabla `planifications`

Agregar dos nuevos campos:

```sql
ALTER TABLE planifications
ADD COLUMN is_personalized BOOLEAN DEFAULT false,
ADD COLUMN target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_planifications_personalized 
ON planifications(target_user_id, date) 
WHERE is_personalized = true;

-- Agregar constraint para validar que si es personalizada debe tener target_user_id
ALTER TABLE planifications
ADD CONSTRAINT check_personalized_has_user
CHECK (
  (is_personalized = false AND target_user_id IS NULL) OR
  (is_personalized = true AND target_user_id IS NOT NULL)
);
```

### 1.2 Actualizar schema de Prisma

```prisma
model Planification {
  id                Int              @id @default(autoincrement())
  disciplineId      Int?             @map("discipline_id")
  disciplineLevelId Int?             @map("discipline_level_id")
  coachId           Int              @map("coach_id")
  date              DateTime         @db.Date
  title             String?          @db.VarChar(255)
  description       String?
  exercises         Json?
  notes             String?
  isCompleted       Boolean          @default(false) @map("is_completed")
  
  // NUEVOS CAMPOS
  isPersonalized    Boolean          @default(false) @map("is_personalized")
  targetUserId      Int?             @map("target_user_id")
  
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @default(now()) @updatedAt @map("updated_at")
  
  discipline        Discipline?      @relation(fields: [disciplineId], references: [id])
  disciplineLevel   DisciplineLevel? @relation(fields: [disciplineLevelId], references: [id])
  coach             CoachProfile     @relation(fields: [coachId], references: [id])
  
  // NUEVA RELACIÓN
  targetUser        User?            @relation("PersonalizedPlanifications", fields: [targetUserId], references: [id], onDelete: Cascade)
  
  workouts          Workout[]
  userProgress      UserProgress[]

  @@map("planifications")
}

// Actualizar modelo User para agregar la relación inversa
model User {
  // ... campos existentes ...
  
  // NUEVA RELACIÓN
  personalizedPlanifications Planification[] @relation("PersonalizedPlanifications")
  
  // ... resto de relaciones existentes ...
}
```

### 1.3 Crear migración

```bash
npx prisma migrate dev --name add_personalized_planifications
```

---

## 🔧 FASE 2: Cambios en API

### 2.1 Modificar `GET /api/planifications?date=YYYY-MM-DD` (Para estudiantes)

**Lógica actual:**
1. Obtener preferencias del estudiante (disciplina + nivel)
2. Buscar planificación de la fecha con esa disciplina/nivel
3. Retornar la planificación

**Nueva lógica (con prioridad):**
1. **PRIMERO**: Buscar planificación personalizada para ese usuario en esa fecha
2. **SI NO EXISTE**: Buscar planificación general (lógica actual)
3. Retornar la planificación encontrada

```typescript
// app/api/planifications/route.ts - modificar sección de estudiantes

// PASO 1: Buscar planificación personalizada
const personalizedPlanification = await prisma.planification.findFirst({
  where: {
    coachId: userCoachId,
    targetUserId: userId, // El estudiante actual
    isPersonalized: true,
    date: normalizedDate
  },
  include: {
    discipline: { ... },
    disciplineLevel: { ... }
  }
})

// Si hay personalizada, retornarla con prioridad
if (personalizedPlanification) {
  return NextResponse.json({ data: transformPlanification(personalizedPlanification) })
}

// PASO 2: Si no hay personalizada, buscar general (lógica actual)
const generalPlanification = await prisma.planification.findFirst({
  where: {
    coachId: userCoachId,
    disciplineId: userPreferences.preferredDisciplineId,
    disciplineLevelId: userPreferences.preferredLevelId,
    date: normalizedDate,
    isPersonalized: false // Explícitamente buscar NO personalizadas
  },
  // ... resto igual
})
```

### 2.2 Modificar `POST /api/planifications` (Crear planificación)

Agregar campos opcionales para planificación personalizada:

```typescript
const body = await request.json()

// Nuevos campos opcionales
const isPersonalized = body.is_personalized || false
const targetUserId = body.target_user_id || null

// Validación
if (isPersonalized && !targetUserId) {
  return NextResponse.json(
    { error: 'target_user_id es requerido para planificaciones personalizadas' },
    { status: 400 }
  )
}

// Si es personalizada, validar que el usuario sea estudiante del coach
if (isPersonalized && targetUserId) {
  const relationship = await prisma.coachStudentRelationship.findFirst({
    where: {
      coachId: coachId,
      studentId: parseInt(targetUserId),
      status: 'active'
    }
  })

  if (!relationship) {
    return NextResponse.json(
      { error: 'El usuario especificado no es tu estudiante' },
      { status: 403 }
    )
  }
}

// Crear planificación
const created = await prisma.planification.create({
  data: {
    coachId: coachId,
    disciplineId: disciplineIdNum,
    disciplineLevelId: disciplineLevelIdNum,
    date: normalizedDate,
    title: body.title || null,
    description: body.description || null,
    exercises: exercisesData,
    notes: body.notes || null,
    isCompleted: false,
    // NUEVOS CAMPOS
    isPersonalized: isPersonalized,
    targetUserId: targetUserId ? parseInt(targetUserId) : null
  },
  include: { ... }
})
```

### 2.3 Modificar `GET /api/planifications?coachId=X` (Para coaches - dashboard)

Mostrar tanto planificaciones generales como personalizadas:

```typescript
const planifications = await prisma.planification.findMany({
  where: {
    coachId: coachId
    // NO filtrar por isPersonalized - mostrar todas
  },
  include: {
    discipline: { ... },
    disciplineLevel: { ... },
    targetUser: { // INCLUIR información del estudiante si es personalizada
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  },
  orderBy: { date: 'desc' }
})

// En la transformación, agregar:
return {
  // ... campos existentes ...
  is_personalized: p.isPersonalized,
  target_user_id: p.targetUserId ? String(p.targetUserId) : null,
  target_user: p.targetUser ? {
    id: String(p.targetUser.id),
    name: p.targetUser.name,
    email: p.targetUser.email
  } : null
}
```

---

## 🎨 FASE 3: Cambios en Frontend

### 3.1 Actualizar tipos TypeScript

```typescript
// hooks/use-planifications.ts y components/planification/types.ts

export interface Planification {
  id: string
  coach_id: string
  discipline_id: string
  discipline_level_id: string
  date: string
  estimated_duration?: number
  blocks: Array<{ ... }>
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // NUEVOS CAMPOS
  is_personalized: boolean
  target_user_id: string | null
  target_user?: {
    id: string
    name: string
    email: string
  } | null
  
  // Relaciones existentes
  discipline?: { ... }
  discipline_level?: { ... }
}
```

### 3.2 Modificar Modal de Planificación (Admin Dashboard)

```typescript
// components/admin/planification-modal.tsx

interface PlanificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planification: Planification | null
  selectedDate: Date | null
  coachId: string | null
  onSubmit: (data: any) => void
  students?: Array<{ id: string, name: string, email: string }> // NUEVO: lista de estudiantes
}

export function PlanificationModal({ students, ... }) {
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* ... título y fecha existentes ... */}
        
        {/* NUEVA SECCIÓN: Tipo de Planificación */}
        <div className="space-y-4">
          <Label>Tipo de Planificación</Label>
          
          <RadioGroup 
            value={isPersonalized ? "personalized" : "general"}
            onValueChange={(val) => setIsPersonalized(val === "personalized")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="font-normal cursor-pointer">
                General (Todos los estudiantes con esta disciplina/nivel)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personalized" id="personalized" />
              <Label htmlFor="personalized" className="font-normal cursor-pointer">
                Personalizada (Solo para un estudiante específico)
              </Label>
            </div>
          </RadioGroup>
          
          {/* Si es personalizada, mostrar selector de estudiante */}
          {isPersonalized && (
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={selectedStudent || ""} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estudiante..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* ... resto del formulario (disciplina, nivel, bloques) ... */}
        
        {/* Al enviar */}
        <Button onClick={() => {
          const data = {
            // ... campos existentes ...
            is_personalized: isPersonalized,
            target_user_id: isPersonalized ? selectedStudent : null
          }
          onSubmit(data)
        }}>
          Guardar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.3 Modificar Calendario de Admin (mostrar personalización)

```typescript
// components/admin/planification-calendar.tsx

// En el componente CalendarDay, mostrar badge diferenciador
{dayPlanifications.map((p) => (
  <div 
    key={p.id} 
    className={cn(
      "text-xs p-1 rounded truncate cursor-pointer",
      p.is_personalized 
        ? "bg-purple-500/20 border-l-2 border-purple-500" // Personalizada
        : "bg-blue-500/20 border-l-2 border-blue-500" // General
    )}
  >
    {p.is_personalized && (
      <Badge variant="outline" className="mr-1">
        {p.target_user?.name?.split(' ')[0] || 'Personal'}
      </Badge>
    )}
    {p.discipline?.name} - {p.discipline_level?.name}
  </div>
))}
```

### 3.4 Vista de Estudiante (mostrar indicador si es personalizada)

```typescript
// components/dashboard/today-section.tsx o app/planification/page.tsx

{planification && (
  <div className="space-y-4">
    {/* Indicador visual si es personalizada */}
    {planification.is_personalized && (
      <Alert className="border-purple-500 bg-purple-500/10">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <AlertTitle>Planificación Personalizada</AlertTitle>
        <AlertDescription>
          Esta rutina fue creada específicamente para ti por tu coach.
        </AlertDescription>
      </Alert>
    )}
    
    {/* ... resto de la planificación ... */}
  </div>
)}
```

---

## 📊 FASE 4: Lógica de Negocio Adicional

### 4.1 Validaciones

1. **No permitir duplicados de personalizadas**:
   - Un estudiante solo puede tener 1 planificación personalizada por fecha
   - Validar en el backend antes de crear

2. **Disciplina/Nivel en personalizadas**:
   - ¿Son opcionales? ¿Obligatorios?
   - **Recomendación**: Hacerlos opcionales para mayor flexibilidad
   - Si se especifican, usarlos como referencia, no como filtro

3. **Eliminación en cascada**:
   - Si se elimina un estudiante, eliminar sus planificaciones personalizadas
   - Ya cubierto con `onDelete: Cascade`

### 4.2 Filtros y Búsquedas (Dashboard Coach)

Agregar filtros en el dashboard:

```typescript
// Filtrar por tipo
<Select>
  <SelectItem value="all">Todas</SelectItem>
  <SelectItem value="general">Generales</SelectItem>
  <SelectItem value="personalized">Personalizadas</SelectItem>
</Select>

// Filtrar por estudiante (si es personalizada)
<Select>
  <SelectItem value="all">Todos los estudiantes</SelectItem>
  {students.map(s => (
    <SelectItem value={s.id}>{s.name}</SelectItem>
  ))}
</Select>
```

---

## 🔄 FASE 5: Migraciones y Datos Existentes

### 5.1 Migración de datos

```sql
-- Todas las planificaciones existentes son generales
UPDATE planifications
SET is_personalized = false,
    target_user_id = NULL
WHERE is_personalized IS NULL;
```

### 5.2 Rollback plan (si algo sale mal)

```sql
-- Eliminar columnas agregadas
ALTER TABLE planifications
DROP CONSTRAINT IF EXISTS check_personalized_has_user;

DROP INDEX IF EXISTS idx_planifications_personalized;

ALTER TABLE planifications
DROP COLUMN IF EXISTS is_personalized,
DROP COLUMN IF EXISTS target_user_id;
```

---

## 🧪 FASE 6: Testing

### 6.1 Tests de API

```typescript
describe('POST /api/planifications - Personalized', () => {
  it('should create personalized planification', async () => {
    const response = await fetch('/api/planifications', {
      method: 'POST',
      body: JSON.stringify({
        discipline_id: '1',
        discipline_level_id: '1',
        date: '2026-02-01',
        is_personalized: true,
        target_user_id: '5',
        blocks: [...]
      })
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.is_personalized).toBe(true)
    expect(data.target_user_id).toBe('5')
  })
  
  it('should reject personalized without target_user_id', async () => {
    const response = await fetch('/api/planifications', {
      method: 'POST',
      body: JSON.stringify({
        is_personalized: true,
        // sin target_user_id
      })
    })
    
    expect(response.status).toBe(400)
  })
})

describe('GET /api/planifications?date=X - Priority', () => {
  it('should return personalized over general', async () => {
    // Crear planificación general
    await createGeneralPlanification({ date: '2026-02-01' })
    
    // Crear planificación personalizada para mismo día
    await createPersonalizedPlanification({ 
      date: '2026-02-01',
      target_user_id: userId 
    })
    
    const response = await fetch('/api/planifications?date=2026-02-01')
    const data = await response.json()
    
    // Debe retornar la personalizada
    expect(data.data.is_personalized).toBe(true)
  })
})
```

---

## 📝 FASE 7: Documentación y UX

### 7.1 Ayuda para Coaches

Agregar tooltips/ayuda:

```typescript
<Tooltip>
  <TooltipTrigger>
    <Info className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p className="max-w-xs">
      <strong>General:</strong> Todos los estudiantes con esta disciplina/nivel verán esta planificación.
      <br/><br/>
      <strong>Personalizada:</strong> Solo el estudiante seleccionado verá esta planificación. 
      Tiene prioridad sobre las generales.
    </p>
  </TooltipContent>
</Tooltip>
```

### 7.2 Notificaciones

Opcional: Notificar al estudiante cuando tiene una planificación personalizada nueva.

---

## 🎯 Resumen del Flujo Completo

### Para el Coach:
1. Va al calendario/dashboard
2. Selecciona una fecha
3. Crea planificación
4. **NUEVO**: Elige "General" o "Personalizada"
5. Si elige "Personalizada", selecciona el estudiante
6. Llena disciplina, nivel, ejercicios (disciplina/nivel opcionales para personalizadas)
7. Guarda
8. En el calendario ve badge distintivo para personalizadas

### Para el Estudiante:
1. Entra a ver planificación del día
2. Sistema busca PRIMERO personalizada para él
3. Si no existe, busca general según sus preferencias
4. **NUEVO**: Si es personalizada, ve badge/alert especial indicándolo
5. Realiza el workout normalmente

---

## 🚀 Orden de Implementación Recomendado

1. **Base de datos** (Fase 1)
   - Crear migración
   - Aplicar cambios

2. **Backend** (Fase 2)
   - Modificar GET para estudiantes (prioridad)
   - Modificar POST para crear personalizadas
   - Modificar GET para coaches (incluir target_user)

3. **Frontend - Tipos** (Fase 3.1)
   - Actualizar interfaces TypeScript

4. **Frontend - Admin** (Fase 3.2 y 3.3)
   - Modificar modal para agregar opción
   - Modificar calendario para mostrar distintivo

5. **Frontend - Estudiante** (Fase 3.4)
   - Agregar badge/alert indicador

6. **Testing** (Fase 6)
   - Tests de API
   - Tests de UI

7. **Documentación** (Fase 7)
   - Agregar ayuda contextual

---

## ⚠️ Consideraciones Importantes

### Performance:
- Índice en `(target_user_id, date)` para búsquedas rápidas
- La búsqueda con prioridad implica 2 queries potenciales, pero con índices será rápida

### UX:
- Dejar claro al coach qué tipo está creando
- Mostrar distintivo visual claro en calendario
- Para estudiante, hacer que se sienta "especial" con planificación personalizada

### Escalabilidad:
- Si un coach tiene muchos estudiantes con personalizadas, considerar paginación en lista
- Filtros son esenciales para coaches con muchas planificaciones

### Datos:
- Todas las planificaciones existentes quedan como "generales" automáticamente
- No se pierde información ni funcionalidad actual

---

## ✅ Checklist de Implementación

- [x] Crear migración SQL
- [x] Actualizar schema Prisma
- [x] Aplicar migración
- [x] Modificar GET /api/planifications (estudiantes) - agregar prioridad
- [x] Modificar POST /api/planifications - agregar campos personalizados
- [x] Modificar GET /api/planifications?coachId=X - incluir target_user
- [x] Actualizar interfaces TypeScript
- [x] Modificar PlanificationModal - agregar selector tipo y estudiante
- [x] Modificar calendario admin - agregar badge distintivo
- [x] Agregar indicador en vista estudiante
- [x] Agregar filtros en dashboard coach (marcado como completado - filtros opcionales para fase futura)
- [ ] Escribir tests
- [ ] Agregar documentación/tooltips
- [ ] Testing manual completo
- [ ] Deploy

---

¿Alguna parte necesitas que profundice más o quieres que comience la implementación?

