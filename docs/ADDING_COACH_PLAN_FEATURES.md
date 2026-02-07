# Guía: Agregar Nuevas Opciones a los Planes de Coach

Esta guía explica paso a paso cómo agregar nuevas características (features) a los planes de coach (START, POWER, ELITE) y cómo hacerlas disponibles para los planes de alumnos.

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Paso 1: Agregar al Schema de Prisma](#paso-1-agregar-al-schema-de-prisma)
3. [Paso 2: Actualizar el Seed](#paso-2-actualizar-el-seed)
4. [Paso 3: Actualizar Tipos TypeScript](#paso-3-actualizar-tipos-typescript)
5. [Paso 4: Lógica de Negocio](#paso-4-lógica-de-negocio)
6. [Paso 5: UI de SuperAdmin](#paso-5-ui-de-superadmin)
7. [Paso 6: Validaciones](#paso-6-validaciones)
8. [Ejemplo Completo](#ejemplo-completo)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│  1. COACH PLAN TYPE (CoachPlanType)                        │
│     - Definido en DB por superAdmin                        │
│     - Ej: START tiene "video_uploads: true"                │
├─────────────────────────────────────────────────────────────┤
│  2. COACH (tiene un plan)                                  │
│     - Hereda features de su CoachPlanType                  │
│     - Ej: Coach en START puede subir videos                │
├─────────────────────────────────────────────────────────────┤
│  3. PLAN DE ALUMNO (SubscriptionPlan)                      │
│     - Creado por el coach                                  │
│     - Solo puede ofrecer lo que el coach tiene             │
│     - Ej: Plan "Pro" incluye acceso a videos               │
└─────────────────────────────────────────────────────────────┘
```

**Reglas:**
- Si el coach **NO** tiene el feature → No puede ofrecerlo a alumnos
- Si el coach **SÍ** tiene el feature → Puede elegir ofrecerlo o no en cada plan
- Algunos features son **heredados automáticamente** (ej: planificación)

---

## Paso 1: Agregar al Schema de Prisma

### Opción A: Campo en la Tabla (para valores simples)

Si es un número o booleano que el superAdmin configura directamente:

```prisma
model CoachPlanType {
  id                 Int     @id @default(autoincrement())
  slug               String  @unique
  name               String  @unique
  
  // ... campos existentes ...
  
  // NUEVO: Campo directo
  maxVideoStorage    Int     @default(100) @map("max_video_storage") // MB
  canGoLive          Boolean @default(false) @map("can_go_live")
}
```

### Opción B: Dentro del JSON de Features (recomendado para booleanos)

Si es una característica on/off que puede cambiar:

```prisma
// No cambiar el schema, solo el contenido del JSON
// El campo "features" ya existe como Json?
```

**¿Cuál usar?**
- Usa **campo directo** si el superAdmin necesita filtrar/ordenar por este valor
- Usa **JSON** si es puramente una característica on/off

---

## Paso 2: Actualizar el Seed

Agregar el nuevo campo en `prisma/seed.ts`:

```typescript
// Plan START
await prisma.coachPlanType.upsert({
  where: { slug: 'start' },
  update: {},
  create: {
    slug: 'start',
    name: 'Start',
    // ... campos existentes ...
    
    // NUEVO: Valores por defecto para START
    maxVideoStorage: 500,      // 500 MB
    features: {
      // ... features existentes ...
      video_library: true,     // NUEVO
      live_streaming: false,   // NUEVO
    }
  }
});

// Plan POWER
await prisma.coachPlanType.upsert({
  where: { slug: 'power' },
  update: {},
  create: {
    // ...
    maxVideoStorage: 2000,     // 2 GB
    features: {
      // ...
      video_library: true,
      live_streaming: true,    // POWER puede hacer live
    }
  }
});

// Plan ELITE
await prisma.coachPlanType.upsert({
  where: { slug: 'elite' },
  update: {},
  create: {
    // ...
    maxVideoStorage: 10000,    // 10 GB
    features: {
      // ...
      video_library: true,
      live_streaming: true,
      video_analytics: true,   // Solo ELITE
    }
  }
});
```

**Ejecutar:**
```bash
npx prisma db seed
```

---

## Paso 3: Actualizar Tipos TypeScript

### 3.1 Interface de Features del Coach

En `lib/coach-plan-features.ts`:

```typescript
export interface CoachPlanFeatures {
  // ... features existentes ...
  
  // NUEVO: Features para el coach
  video_library?: boolean;
  live_streaming?: boolean;
  video_analytics?: boolean;
}
```

### 3.2 Interface de Features del Alumno

Si el alumno también se beneficia de esto:

```typescript
// En el mismo archivo o donde definas StudentPlanFeatures
export interface StudentPlanFeatures {
  // ... features existentes ...
  
  // NUEVO: Lo que el alumno puede acceder
  videoLibraryAccess: boolean;      // Ver videos
  liveStreamingAccess: boolean;     // Ver lives
  videoAnalyticsAccess: boolean;    // Ver estadísticas (solo ELITE)
}
```

### 3.3 Helper Functions (opcional)

Si necesitas lógica específica:

```typescript
/**
 * Obtiene el límite de almacenamiento de video del coach
 */
export async function getCoachVideoStorageLimit(coachId: number): Promise<number> {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        take: 1,
        include: { plan: true }
      }
    }
  });

  if (!coachProfile?.subscriptions.length) {
    return 0;
  }

  return coachProfile.subscriptions[0].plan.maxVideoStorage || 0;
}
```

---

## Paso 4: Lógica de Negocio

### 4.1 Validar si el Coach tiene el Feature

```typescript
// lib/coach-plan-features.ts
export async function coachCanUploadVideos(coachId: number): Promise<boolean> {
  return coachHasFeature(coachId, 'video_library');
}

export async function coachCanGoLive(coachId: number): Promise<boolean> {
  return coachHasFeature(coachId, 'live_streaming');
}
```

### 4.2 Validar Creación de Plan de Alumno

En la API de creación de planes (`/api/subscription-plans`):

```typescript
// Validar que el coach puede ofrecer videos
if (studentPlanFeatures.videoLibraryAccess) {
  const coachCanOffer = await coachHasFeature(coachId, 'video_library');
  if (!coachCanOffer) {
    return error(403, 'No puedes ofrecer acceso a videos. Upgradea tu plan.');
  }
}

// Validar live streaming
if (studentPlanFeatures.liveStreamingAccess) {
  const coachCanOffer = await coachHasFeature(coachId, 'live_streaming');
  if (!coachCanOffer) {
    return error(403, 'El live streaming no está disponible en tu plan.');
  }
}
```

---

## Paso 5: UI de SuperAdmin

### 5.1 Agregar Inputs en el Formulario

En `components/superadmin/edit-plan/predefined-features-section.tsx`:

```tsx
// Para campos booleanos (Switch)
<div className="flex items-center justify-between">
  <Label htmlFor="video_library">Biblioteca de Videos</Label>
  <Switch
    id="video_library"
    checked={features.video_library || false}
    onCheckedChange={(checked) => onFeatureChange('video_library', checked)}
  />
</div>

<div className="flex items-center justify-between">
  <Label htmlFor="live_streaming">Live Streaming</Label>
  <Switch
    id="live_streaming"
    checked={features.live_streaming || false}
    onCheckedChange={(checked) => onFeatureChange('live_streaming', checked)}
  />
</div>

// Para campos numéricos (Input)
<div className="space-y-2">
  <Label htmlFor="max_video_storage">Almacenamiento Video (MB)</Label>
  <Input
    id="max_video_storage"
    type="number"
    value={maxVideoStorage || 0}
    onChange={(e) => onFeatureChange('max_video_storage', parseInt(e.target.value) || 0)}
  />
</div>
```

### 5.2 Mostrar en la Lista de Planes

En `components/superadmin/coach-plans-list.tsx`:

```tsx
// Mostrar el nuevo campo en la tabla/card
<div className="flex items-center gap-2">
  <VideoIcon className="w-4 h-4" />
  <span>{plan.maxVideoStorage} MB de videos</span>
</div>
```

---

## Paso 6: Validaciones

### 6.1 Al Subir Video (Ejemplo)

```typescript
// API: /api/videos/upload
export async function POST(request: Request) {
  const coachId = getCoachIdFromSession();
  
  // Validar que puede subir videos
  const canUpload = await coachCanUploadVideos(coachId);
  if (!canUpload) {
    return error(403, 'Tu plan no incluye biblioteca de videos');
  }
  
  // Validar límite de almacenamiento
  const storageLimit = await getCoachVideoStorageLimit(coachId);
  const currentUsage = await getCoachVideoUsage(coachId);
  
  if (currentUsage + newVideoSize > storageLimit) {
    return error(400, `Has excedido tu límite de ${storageLimit} MB. Upgradea tu plan.`);
  }
  
  // Proceder con upload...
}
```

### 6.2 Al Crear Plan de Alumno

```typescript
// Validar que no promete más de lo que tiene
const validation = {
  videoLibraryAccess: coachFeatures.video_library && requested.videoLibraryAccess,
  liveStreamingAccess: coachFeatures.live_streaming && requested.liveStreamingAccess,
};

if (requested.videoLibraryAccess && !coachFeatures.video_library) {
  return error(403, 'No puedes ofrecer videos sin tener la feature activa');
}
```

---

## Ejemplo Completo

### Escenario: Agregar "Modo Oscuro Personalizado"

**Requisito:** Solo coaches en POWER y ELITE pueden personalizar el tema oscuro de su dashboard.

#### 1. Schema (JSON)
No necesitamos campo nuevo, usamos `features`.

#### 2. Seed
```typescript
// START
features: {
  custom_dark_mode: false
}

// POWER y ELITE
features: {
  custom_dark_mode: true
}
```

#### 3. TypeScript
```typescript
// lib/coach-plan-features.ts
export interface CoachPlanFeatures {
  // ...
  custom_dark_mode?: boolean;
}

export async function coachCanCustomizeTheme(coachId: number): Promise<boolean> {
  return coachHasFeature(coachId, 'custom_dark_mode');
}
```

#### 4. UI del Coach (Mi Plan)
```tsx
// components/admin/dashboard/my-plan-section.tsx
{planInfo.features.custom_dark_mode && (
  <ThemeCustomizer />
)}
```

#### 5. Validación
```typescript
// En la API de guardar tema
const canCustomize = await coachCanCustomizeTheme(coachId);
if (!canCustomize) {
  return error(403, 'El tema personalizado requiere plan POWER o superior');
}
```

---

## 📝 Checklist

Antes de deployar, verificar:

- [ ] Schema de Prisma actualizado (si es campo directo)
- [ ] Seed actualizado con valores para los 3 planes
- [ ] Tipos TypeScript actualizados
- [ ] Funciones helper creadas
- [ ] Validaciones en API implementadas
- [ ] UI de SuperAdmin actualizada
- [ ] UI de Coach actualizada (si aplica)
- [ ] Tests (si existen) actualizados

---

## 🆘 Troubleshooting

**Problema:** El coach no ve el nuevo feature
- Verificar que el seed se ejecutó correctamente
- Verificar que el coach tenga una suscripción activa al plan correcto
- Limpiar caché si se usa (localStorage, Redis, etc.)

**Problema:** El alumno puede acceder a algo que el coach no tiene
- Revisar validaciones en `/api/subscription-plans`
- Verificar que se esté validando `coachHasFeature` antes de permitir

**Problema:** El superAdmin no puede editar el campo
- Verificar que el campo esté en el formulario de `predefined-features-section.tsx`
- Verificar que se esté guardando en la mutación de Prisma

---

## 💡 Buenas Prácticas

1. **Nombres consistentes:** Usa `snake_case` en DB y `camelCase` en TypeScript
2. **Defaults seguros:** Siempre asume `false` o `0` para planes nuevos
3. **Retrocompatibilidad:** Los features nuevos deben ser opcionales (`?`) para planes existentes
4. **Documentación:** Agrega comentarios JSDoc en las funciones helper
