# Plan de Migración: B2C → B2B2C

## 📋 Resumen Ejecutivo

Este documento detalla el plan completo para migrar el modelo de negocio de **B2C (Business to Consumer)** a **B2B2C (Business to Business to Consumer)**, donde los entrenadores (coaches) son los clientes principales que administran la app para sus alumnos (students).

---

## 🎯 Objetivos del Nuevo Modelo

1. **Entrenadores como clientes principales**: Vender planes a entrenadores según cantidad de alumnos
2. **Doble monetización**: 
   - Plan base del entrenador (según capacidad de alumnos)
   - Comisión por cada suscripción de alumno
3. **Relación Coach-Student**: Un entrenador puede tener múltiples alumnos vinculados
4. **Migración sin pérdida de datos**: Preservar usuarios y suscripciones existentes

---

## 📊 Estructura de Planes Propuesta

### Planes para Entrenadores

| Plan | Alumnos | Precio Base | Comisión | Ideal Para |
|------|---------|-------------|----------|------------|
| **STARTER** | 1-10 | $15,000 ARS/mes | 12% | Entrenadores independientes |
| **GROWTH** | 11-50 | $25,000 ARS/mes | 10% | Entrenadores establecidos |
| **ENTERPRISE** | 51+ | $40,000 ARS/mes | 7% | Gimnasios grandes |

### Planes para Alumnos (Students)

Los alumnos tendrán sus propios planes de suscripción (pueden mantener los actuales o crear nuevos):
- Plan Básico
- Plan Intermedio  
- Plan Pro

**Nota**: Los alumnos pagan directamente a la plataforma, y el entrenador recibe comisión.

---

## 🗄️ FASE 1: Cambios en Base de Datos

### 1.1 Nuevas Tablas

#### `coach_profiles`
```sql
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  max_students INTEGER NOT NULL DEFAULT 10,
  current_student_count INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 12.00, -- Porcentaje de comisión
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### `coach_subscriptions`
```sql
CREATE TABLE coach_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active', -- active, canceled, past_due, unpaid
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  mercadopago_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `coach_student_relationships`
```sql
CREATE TABLE coach_student_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, removed
  joined_at TIMESTAMP DEFAULT NOW(),
  removed_at TIMESTAMP,
  UNIQUE(coach_id, student_id)
);
```

#### `coach_commissions`
```sql
CREATE TABLE coach_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  student_subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  student_id UUID NOT NULL REFERENCES users(id),
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  student_subscription_amount DECIMAL(10,2) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, canceled
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `coach_plan_types`
```sql
CREATE TABLE coach_plan_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'starter', 'growth', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  min_students INTEGER NOT NULL,
  max_students INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Modificaciones a Tablas Existentes

#### `user_roles_simple`
```sql
-- Agregar nuevos roles
ALTER TABLE user_roles_simple 
  ADD CONSTRAINT check_role CHECK (role IN ('admin', 'user', 'coach', 'student'));

-- O actualizar los roles existentes si es necesario
-- UPDATE user_roles_simple SET role = 'student' WHERE role = 'user' AND ... (lógica de migración)
```

#### `subscription_plans`
```sql
-- Agregar campo para distinguir planes de coaches vs students
ALTER TABLE subscription_plans 
  ADD COLUMN plan_type VARCHAR(20) DEFAULT 'student'; -- 'student' o 'coach'

-- Agregar campo para identificar si es plan de coach
ALTER TABLE subscription_plans 
  ADD COLUMN is_coach_plan BOOLEAN DEFAULT false;
```

#### `subscriptions`
```sql
-- Agregar campo opcional para vincular suscripción de student a coach
ALTER TABLE subscriptions 
  ADD COLUMN coach_id UUID REFERENCES coach_profiles(id);

-- Agregar índice para búsquedas por coach
CREATE INDEX idx_subscriptions_coach_id ON subscriptions(coach_id);
```

### 1.3 Índices y Constraints

```sql
-- Índices para performance
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_coach_subscriptions_coach_id ON coach_subscriptions(coach_id);
CREATE INDEX idx_coach_student_relationships_coach_id ON coach_student_relationships(coach_id);
CREATE INDEX idx_coach_student_relationships_student_id ON coach_student_relationships(student_id);
CREATE INDEX idx_coach_commissions_coach_id ON coach_commissions(coach_id);
CREATE INDEX idx_coach_commissions_student_subscription_id ON coach_commissions(student_subscription_id);
```

---

## 🔐 FASE 2: Sistema de Roles y Autenticación

### 2.1 Actualizar Tipos TypeScript

**Archivo**: `lib/auth.ts`
- Actualizar tipos de roles: `'admin' | 'user' | 'coach' | 'student'`
- Actualizar interfaces de sesión para incluir `coachProfile` opcional

**Archivo**: `lib/neon.ts`
- Agregar interfaces para:
  - `CoachProfile`
  - `CoachSubscription`
  - `CoachStudentRelationship`
  - `CoachCommission`
  - `CoachPlanType`

### 2.2 Actualizar Hooks de Autenticación

**Archivo**: `hooks/use-auth-with-roles.ts`
- Agregar lógica para detectar rol `coach`
- Cargar `coachProfile` cuando el usuario es coach
- Agregar helpers: `isCoach`, `isStudent`, `isCoachOrAdmin`

### 2.3 Middleware y Protección de Rutas

**Archivo**: `middleware.ts`
- Agregar rutas protegidas para coaches: `/coach/*`
- Agregar rutas protegidas para students: `/student/*` (si aplica)
- Validar que coaches solo accedan a sus propios datos

---

## 💰 FASE 3: Sistema de Planes y Suscripciones

### 3.1 Crear Planes de Coach en Base de Datos

**Script de migración**: Crear planes iniciales
```sql
INSERT INTO coach_plan_types (name, display_name, min_students, max_students, base_price, commission_rate, features, is_active)
VALUES
  ('starter', 'Starter', 1, 10, 15000.00, 12.00, '{"dashboard": true, "basic_analytics": true}'::jsonb, true),
  ('growth', 'Growth', 11, 50, 25000.00, 10.00, '{"dashboard": true, "advanced_analytics": true, "reports": true}'::jsonb, true),
  ('enterprise', 'Enterprise', 51, 999999, 40000.00, 7.00, '{"dashboard": true, "advanced_analytics": true, "reports": true, "white_label": true, "api_access": true}'::jsonb, true);
```

### 3.2 API Routes para Coaches

#### `app/api/coaches/route.ts`
- `GET`: Listar coaches (solo admin)
- `POST`: Crear perfil de coach (registro)

#### `app/api/coaches/[coachId]/route.ts`
- `GET`: Obtener perfil de coach
- `PATCH`: Actualizar perfil de coach
- `DELETE`: Eliminar coach (solo admin)

#### `app/api/coaches/[coachId]/subscription/route.ts`
- `GET`: Obtener suscripción actual del coach
- `POST`: Crear/renovar suscripción del coach
- `PATCH`: Actualizar suscripción (cambiar plan, cancelar)

#### `app/api/coaches/[coachId]/students/route.ts`
- `GET`: Listar estudiantes del coach
- `POST`: Agregar estudiante al coach (invitación)

#### `app/api/coaches/[coachId]/students/[studentId]/route.ts`
- `DELETE`: Remover estudiante del coach

#### `app/api/coaches/[coachId]/commissions/route.ts`
- `GET`: Obtener historial de comisiones
- `POST`: Calcular comisiones del período actual

#### `app/api/coaches/plans/route.ts`
- `GET`: Listar planes disponibles para coaches

### 3.3 Modificar API de Suscripciones Existentes

**Archivo**: `app/api/subscriptions/route.ts`
- Modificar `POST` para aceptar `coach_id` opcional
- Cuando un student se suscribe, si tiene `coach_id`, crear registro en `coach_commissions`

**Archivo**: `app/api/subscriptions/[id]/cancel/route.ts`
- Al cancelar suscripción de student, actualizar comisiones del coach

**Archivo**: `app/api/webhooks/mercadopago/route.ts`
- Al procesar pago de student, calcular y crear comisión para el coach
- Al procesar pago de coach, activar/renovar suscripción del coach

### 3.4 Hooks para Coaches

**Archivo**: `hooks/use-coach.ts`
- `useCoach()`: Hook para obtener perfil de coach actual
- `useCoachStudents()`: Hook para listar estudiantes
- `useCoachSubscription()`: Hook para suscripción del coach
- `useCoachCommissions()`: Hook para comisiones

---

## 🎨 FASE 4: Interfaz de Usuario - Dashboard de Coach

### 4.1 Página Principal de Coach

**Archivo**: `app/coach/dashboard/page.tsx`
- Vista general del coach
- Estadísticas: total estudiantes, estudiantes activos, comisiones del mes
- Accesos rápidos: agregar estudiante, ver reportes, gestionar suscripción

### 4.2 Gestión de Estudiantes

**Archivo**: `app/coach/students/page.tsx`
- Lista de todos los estudiantes del coach
- Filtros: activos, inactivos, por plan
- Acciones: ver perfil, remover, enviar mensaje

**Componente**: `components/coach/student-list.tsx`
- Tabla con estudiantes
- Cards con información resumida

**Componente**: `components/coach/add-student-modal.tsx`
- Modal para agregar estudiante (por email o código de invitación)

### 4.3 Suscripción del Coach

**Archivo**: `app/coach/subscription/page.tsx`
- Plan actual del coach
- Límite de estudiantes vs. estudiantes actuales
- Opción de upgrade/downgrade
- Historial de pagos

**Componente**: `components/coach/subscription-card.tsx`
- Card mostrando plan actual, precio, límites

**Componente**: `components/coach/plan-switcher.tsx`
- Selector de planes para coaches
- Comparación de planes

### 4.4 Comisiones

**Archivo**: `app/coach/commissions/page.tsx`
- Historial de comisiones
- Comisiones pendientes vs. pagadas
- Gráfico de comisiones por mes
- Total acumulado

**Componente**: `components/coach/commissions-chart.tsx`
- Gráfico de comisiones (usando recharts o similar)

**Componente**: `components/coach/commission-item.tsx`
- Item individual de comisión

### 4.5 Analytics y Reportes

**Archivo**: `app/coach/analytics/page.tsx`
- Métricas de engagement de estudiantes
- Retención de estudiantes
- Actividad de entrenamientos
- Exportar reportes

**Componente**: `components/coach/analytics-dashboard.tsx`
- Dashboard con múltiples métricas

### 4.6 Navegación

**Archivo**: `components/layout/coach-navigation.tsx`
- Menú lateral o superior específico para coaches
- Links: Dashboard, Estudiantes, Suscripción, Comisiones, Analytics

---

## 👥 FASE 5: Flujo de Registro y Onboarding

### 5.1 Registro de Coach

**Archivo**: `app/register/coach/page.tsx`
- Formulario de registro específico para coaches
- Campos: email, password, nombre, nombre del negocio, teléfono
- Al registrarse, crear `coach_profile` y asignar rol `coach`

**Componente**: `components/auth/coach-signup-form.tsx`
- Formulario de registro de coach

### 5.2 Onboarding de Coach

**Archivo**: `app/coach/onboarding/page.tsx`
- Wizard de onboarding:
  1. Seleccionar plan inicial
  2. Configurar perfil del negocio
  3. Invitar primeros estudiantes (opcional)
  4. Tutorial rápido de la plataforma

### 5.3 Invitación de Estudiantes

**Archivo**: `app/invite/[token]/page.tsx`
- Página de aceptación de invitación
- El estudiante puede registrarse o iniciar sesión
- Al aceptar, crear relación `coach_student_relationship`

**API**: `app/api/invites/route.ts`
- `POST`: Crear invitación (generar token único)
- `GET /api/invites/[token]`: Validar token de invitación

---

## 🔄 FASE 6: Migración de Datos Existentes

### 6.1 Estrategia de Migración

**Opción A: Migración Automática (Recomendada)**
- Todos los usuarios existentes con rol `user` se convierten en `student`
- Mantener sus suscripciones activas
- Permitir que se conviertan en coaches si lo desean

**Opción B: Migración Manual**
- Crear herramienta de admin para convertir usuarios a coaches
- Asignar estudiantes manualmente a coaches

### 6.2 Script de Migración

**Archivo**: `scripts/migrate-to-b2b2c.ts`
```typescript
// Pseudocódigo
1. Obtener todos los usuarios con rol 'user'
2. Actualizar rol a 'student'
3. Crear tabla de migración para tracking
4. Permitir conversión manual a coach vía admin panel
```

### 6.3 Preservar Funcionalidad Existente

- Los usuarios existentes deben poder seguir usando la app normalmente
- No romper suscripciones activas
- Mantener compatibilidad con flujos de pago existentes

---

## 💳 FASE 7: Sistema de Comisiones

### 7.1 Cálculo de Comisiones

**Lógica**:
- Cuando un student paga su suscripción, calcular comisión según plan del coach
- Comisión = `student_subscription_amount * (coach_commission_rate / 100)`
- Crear registro en `coach_commissions` con status `pending`

### 7.2 Procesamiento de Comisiones

**Cron Job o Webhook**:
- Al finalizar período de suscripción de student, procesar comisión
- Actualizar `total_earnings` en `coach_profiles`
- Marcar comisión como `paid` o mantener como `pending` según estrategia

### 7.3 Pago de Comisiones

**Estrategia**:
- **Opción A**: Crédito en cuenta (comisiones se acumulan, coach puede retirar)
- **Opción B**: Pago automático mensual (transferencia bancaria)
- **Opción C**: Reducir precio del plan del coach (descuento)

**Recomendación**: Empezar con Opción A (crédito), luego implementar Opción B.

---

## 🛡️ FASE 8: Seguridad y Permisos

### 8.1 Validaciones de Acceso

- Coaches solo pueden ver/editar sus propios estudiantes
- Students solo pueden ver su propio coach
- Admins tienen acceso completo
- Validar límites de estudiantes según plan del coach

### 8.2 RLS (Row Level Security) - Si usas Supabase

```sql
-- Ejemplo de políticas RLS para coach_student_relationships
CREATE POLICY "Coaches can view their own students"
  ON coach_student_relationships
  FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );
```

### 8.3 Validaciones en API Routes

- Verificar que `coach_id` en requests pertenece al usuario autenticado
- Validar límites de estudiantes antes de agregar nuevos
- Verificar permisos antes de remover estudiantes

---

## 📱 FASE 9: Actualizar Componentes Existentes

### 9.1 Dashboard Principal

**Archivo**: `app/page.tsx`
- Detectar rol del usuario
- Redirigir coaches a `/coach/dashboard`
- Redirigir students a dashboard de student (actual)
- Redirigir admins a `/admin-dashboard`

### 9.2 Navegación

**Archivo**: `components/layout/header.tsx`
- Mostrar opciones según rol
- Link a dashboard de coach si es coach

**Archivo**: `components/layout/bottom-navigation.tsx`
- Agregar opciones para coaches

### 9.3 Página de Pricing

**Archivo**: `app/pricing/page.tsx`
- Mostrar dos secciones:
  1. Planes para Coaches
  2. Planes para Estudiantes
- O crear páginas separadas: `/pricing/coaches` y `/pricing/students`

---

## 🧪 FASE 10: Testing y Validación

### 10.1 Tests Unitarios

- Tests para cálculo de comisiones
- Tests para validación de límites de estudiantes
- Tests para creación de relaciones coach-student

### 10.2 Tests de Integración

- Flujo completo de registro de coach
- Flujo de invitación de estudiante
- Flujo de pago y cálculo de comisiones

### 10.3 Tests Manuales

- Registrar nuevo coach
- Agregar estudiantes
- Procesar suscripciones
- Verificar comisiones
- Probar límites de plan

---

## 📋 Checklist de Implementación

### Pre-requisitos
- [ ] Backup completo de base de datos
- [ ] Documentar estructura actual
- [ ] Crear branch de desarrollo: `feature/b2b2c-migration`

### Fase 1: Base de Datos
- [ ] Crear tablas nuevas (`coach_profiles`, `coach_subscriptions`, etc.)
- [ ] Modificar tablas existentes
- [ ] Crear índices y constraints
- [ ] Insertar planes iniciales de coaches
- [ ] Scripts de migración de datos

### Fase 2: Autenticación
- [ ] Actualizar tipos de roles
- [ ] Modificar `lib/auth.ts`
- [ ] Actualizar `hooks/use-auth-with-roles.ts`
- [ ] Actualizar middleware

### Fase 3: Backend APIs
- [ ] Crear APIs de coaches
- [ ] Crear APIs de comisiones
- [ ] Modificar APIs de suscripciones
- [ ] Actualizar webhooks de MercadoPago

### Fase 4: Frontend Coach
- [ ] Dashboard de coach
- [ ] Gestión de estudiantes
- [ ] Suscripción del coach
- [ ] Comisiones
- [ ] Analytics

### Fase 5: Onboarding
- [ ] Registro de coach
- [ ] Onboarding wizard
- [ ] Sistema de invitaciones

### Fase 6: Migración
- [ ] Script de migración de usuarios existentes
- [ ] Herramienta de admin para conversión manual
- [ ] Validar datos migrados

### Fase 7: Comisiones
- [ ] Lógica de cálculo
- [ ] Procesamiento automático
- [ ] Sistema de pagos (crédito/pago)

### Fase 8: Seguridad
- [ ] Validaciones de acceso
- [ ] Políticas RLS (si aplica)
- [ ] Tests de seguridad

### Fase 9: UI Updates
- [ ] Actualizar navegación
- [ ] Actualizar dashboard principal
- [ ] Actualizar página de pricing

### Fase 10: Testing
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests manuales completos
- [ ] QA con usuarios reales

### Post-Lanzamiento
- [ ] Monitoreo de errores
- [ ] Métricas de adopción
- [ ] Feedback de coaches
- [ ] Iteraciones y mejoras

---

## 🚀 Orden de Implementación Recomendado

1. **Semana 1**: Fase 1 (Base de Datos) + Fase 2 (Autenticación)
2. **Semana 2**: Fase 3 (Backend APIs) - APIs básicas de coaches
3. **Semana 3**: Fase 4 (Frontend Coach) - Dashboard y gestión básica
4. **Semana 4**: Fase 5 (Onboarding) + Fase 6 (Migración)
5. **Semana 5**: Fase 7 (Comisiones) + Fase 8 (Seguridad)
6. **Semana 6**: Fase 9 (UI Updates) + Fase 10 (Testing)
7. **Semana 7**: Testing exhaustivo, correcciones, documentación
8. **Semana 8**: Deploy a producción, monitoreo

---

## ⚠️ Consideraciones Importantes

### Compatibilidad Hacia Atrás
- Los usuarios existentes deben poder seguir usando la app
- No romper funcionalidades actuales durante la migración
- Considerar feature flags para activar/desactivar funcionalidades nuevas

### Performance
- Los coaches pueden tener muchos estudiantes
- Optimizar queries para listar estudiantes
- Considerar paginación en todas las listas

### Escalabilidad
- El sistema de comisiones debe ser eficiente
- Considerar procesamiento asíncrono para cálculos
- Cachear datos frecuentemente accedidos

### UX
- El onboarding debe ser claro y guiado
- Los coaches necesitan entender el valor rápidamente
- Proporcionar herramientas útiles desde el día 1

---

## 📝 Notas Finales

- Este plan es un roadmap detallado, pero puede ajustarse según necesidades
- Priorizar funcionalidades core antes de features avanzadas
- Considerar lanzar en beta con coaches selectos antes de público general
- Documentar todo el proceso para futuras referencias

---

**Última actualización**: 09/11/2025
**Versión**: 1.0
**Autor**: Plan de Migración B2B2C