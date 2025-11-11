# Checklist de Migración B2B2C - Orden de Ejecución

## 🎯 Resumen Rápido

Este documento complementa el plan detallado con un checklist ejecutable, ordenado por prioridad y dependencias.

---

## 📅 FASE 1: FUNDACIÓN (Semana 1)

### 1.1 Preparación
- [ ] Crear branch: `git checkout -b feature/b2b2c-migration`
- [ ] Backup completo de base de datos
- [ ] Documentar estructura actual de tablas
- [ ] Revisar y aprobar plan de migración

### 1.2 Base de Datos - Tablas Nuevas
- [ ] Crear tabla `coach_profiles`
- [ ] Crear tabla `coach_subscriptions`
- [ ] Crear tabla `coach_student_relationships`
- [ ] Crear tabla `coach_commissions`
- [ ] Crear tabla `coach_plan_types`
- [ ] Verificar creación de todas las tablas

### 1.3 Base de Datos - Modificaciones
- [ ] Agregar columna `plan_type` a `subscription_plans`
- [ ] Agregar columna `is_coach_plan` a `subscription_plans`
- [ ] Agregar columna `coach_id` a `subscriptions`
- [ ] Actualizar constraint de `user_roles_simple` para incluir 'coach' y 'student'
- [ ] Crear índices necesarios
- [ ] Verificar integridad referencial

### 1.4 Base de Datos - Datos Iniciales
- [ ] Insertar planes de coaches (Starter, Growth, Enterprise)
- [ ] Verificar datos insertados
- [ ] Crear script de rollback (por si acaso)

### 1.5 Autenticación - Tipos
- [ ] Actualizar `lib/auth.ts` - tipos de roles
- [ ] Actualizar `lib/neon.ts` - interfaces nuevas
- [ ] Verificar compilación TypeScript

---

## 📅 FASE 2: AUTENTICACIÓN Y ROLES (Semana 1-2)

### 2.1 Hooks de Autenticación
- [ ] Actualizar `hooks/use-auth-with-roles.ts`
  - [ ] Agregar `isCoach()`
  - [ ] Agregar `isStudent()`
  - [ ] Cargar `coachProfile` cuando sea coach
- [ ] Crear `hooks/use-coach.ts`
  - [ ] `useCoach()` - obtener perfil
  - [ ] `useCoachStudents()` - listar estudiantes
  - [ ] `useCoachSubscription()` - suscripción del coach
  - [ ] `useCoachCommissions()` - comisiones

### 2.2 Middleware y Rutas
- [ ] Actualizar `middleware.ts`
  - [ ] Proteger rutas `/coach/*`
  - [ ] Validar acceso según rol
- [ ] Crear estructura de carpetas para rutas de coach

### 2.3 API de Roles
- [ ] Actualizar `app/api/user-role/route.ts` para incluir coach
- [ ] Verificar que retorna `coachProfile` cuando aplica

---

## 📅 FASE 3: BACKEND - APIs Core (Semana 2)

### 3.1 API de Coaches
- [ ] `app/api/coaches/route.ts`
  - [ ] GET - listar coaches (admin)
  - [ ] POST - crear coach profile
- [ ] `app/api/coaches/[coachId]/route.ts`
  - [ ] GET - obtener perfil
  - [ ] PATCH - actualizar perfil
  - [ ] DELETE - eliminar (admin)
- [ ] `app/api/coaches/plans/route.ts`
  - [ ] GET - listar planes disponibles

### 3.2 API de Suscripciones de Coach
- [ ] `app/api/coaches/[coachId]/subscription/route.ts`
  - [ ] GET - obtener suscripción actual
  - [ ] POST - crear/renovar suscripción
  - [ ] PATCH - actualizar (cancelar, cambiar plan)

### 3.3 API de Estudiantes
- [ ] `app/api/coaches/[coachId]/students/route.ts`
  - [ ] GET - listar estudiantes
  - [ ] POST - agregar estudiante
- [ ] `app/api/coaches/[coachId]/students/[studentId]/route.ts`
  - [ ] DELETE - remover estudiante

### 3.4 API de Comisiones
- [ ] `app/api/coaches/[coachId]/commissions/route.ts`
  - [ ] GET - historial de comisiones
  - [ ] POST - calcular comisiones (manual)

### 3.5 Modificar APIs Existentes
- [ ] `app/api/subscriptions/route.ts`
  - [ ] Modificar POST para aceptar `coach_id`
  - [ ] Crear comisión cuando student se suscribe
- [ ] `app/api/subscriptions/[id]/cancel/route.ts`
  - [ ] Actualizar comisiones al cancelar
- [ ] `app/api/webhooks/mercadopago/route.ts`
  - [ ] Procesar comisiones en webhook
  - [ ] Manejar pagos de coaches

---

## 📅 FASE 4: FRONTEND - Dashboard Coach (Semana 3)

### 4.1 Estructura de Páginas
- [ ] Crear `app/coach/dashboard/page.tsx`
- [ ] Crear `app/coach/students/page.tsx`
- [ ] Crear `app/coach/subscription/page.tsx`
- [ ] Crear `app/coach/commissions/page.tsx`
- [ ] Crear `app/coach/analytics/page.tsx`

### 4.2 Componentes de Coach
- [ ] `components/coach/student-list.tsx`
- [ ] `components/coach/add-student-modal.tsx`
- [ ] `components/coach/subscription-card.tsx`
- [ ] `components/coach/plan-switcher.tsx`
- [ ] `components/coach/commissions-chart.tsx`
- [ ] `components/coach/commission-item.tsx`
- [ ] `components/coach/analytics-dashboard.tsx`

### 4.3 Navegación
- [ ] `components/layout/coach-navigation.tsx`
- [ ] Actualizar `components/layout/header.tsx`
- [ ] Actualizar `components/layout/bottom-navigation.tsx`

---

## 📅 FASE 5: ONBOARDING Y REGISTRO (Semana 4)

### 5.1 Registro de Coach
- [ ] `app/register/coach/page.tsx`
- [ ] `components/auth/coach-signup-form.tsx`
- [ ] Actualizar `app/api/auth/register/route.ts` para coaches

### 5.2 Onboarding
- [ ] `app/coach/onboarding/page.tsx`
- [ ] Wizard de pasos
- [ ] Integración con selección de plan

### 5.3 Sistema de Invitaciones
- [ ] `app/api/invites/route.ts`
  - [ ] POST - crear invitación
  - [ ] GET - validar token
- [ ] `app/invite/[token]/page.tsx`
- [ ] Lógica de aceptación de invitación

---

## 📅 FASE 6: MIGRACIÓN DE DATOS (Semana 4)

### 6.1 Script de Migración
- [ ] Crear `scripts/migrate-to-b2b2c.ts`
- [ ] Convertir usuarios existentes a 'student'
- [ ] Crear tabla de tracking de migración
- [ ] Validar datos migrados

### 6.2 Herramienta de Admin
- [ ] Crear UI en admin para convertir usuarios a coaches
- [ ] Crear UI para asignar students a coaches
- [ ] Validar funcionalidad

### 6.3 Preservar Funcionalidad
- [ ] Verificar que usuarios existentes pueden seguir usando la app
- [ ] Verificar que suscripciones activas siguen funcionando
- [ ] Tests de regresión

---

## 📅 FASE 7: SISTEMA DE COMISIONES (Semana 5)

### 7.1 Lógica de Cálculo
- [ ] Función para calcular comisión
- [ ] Integrar en creación de suscripción de student
- [ ] Integrar en renovación de suscripción

### 7.2 Procesamiento
- [ ] Crear job/cron para procesar comisiones
- [ ] Actualizar `total_earnings` en `coach_profiles`
- [ ] Manejar estados: pending, paid, canceled

### 7.3 UI de Comisiones
- [ ] Mostrar comisiones en dashboard
- [ ] Historial de comisiones
- [ ] Gráficos de comisiones

---

## 📅 FASE 8: SEGURIDAD Y VALIDACIONES (Semana 5)

### 8.1 Validaciones de Acceso
- [ ] Coaches solo ven sus estudiantes
- [ ] Students solo ven su coach
- [ ] Validar límites de estudiantes según plan
- [ ] Tests de permisos

### 8.2 Validaciones en APIs
- [ ] Verificar `coach_id` en requests
- [ ] Validar límites antes de agregar estudiantes
- [ ] Verificar permisos en todas las rutas

### 8.3 RLS (si aplica)
- [ ] Crear políticas RLS para tablas nuevas
- [ ] Testear políticas

---

## 📅 FASE 9: ACTUALIZACIONES UI EXISTENTES (Semana 6)

### 9.1 Dashboard Principal
- [ ] Actualizar `app/page.tsx` para redirigir según rol
- [ ] Crear landing específica para coaches

### 9.2 Pricing
- [ ] Actualizar `app/pricing/page.tsx`
  - [ ] Sección de planes para coaches
  - [ ] Sección de planes para students
- [ ] O crear `/pricing/coaches` y `/pricing/students`

### 9.3 Navegación Global
- [ ] Actualizar todos los componentes de navegación
- [ ] Agregar links según rol
- [ ] Verificar en móvil y desktop

---

## 📅 FASE 10: TESTING (Semana 6-7)

### 10.1 Tests Unitarios
- [ ] Tests de cálculo de comisiones
- [ ] Tests de validación de límites
- [ ] Tests de creación de relaciones
- [ ] Tests de hooks

### 10.2 Tests de Integración
- [ ] Flujo completo: registro coach → agregar student → suscripción → comisión
- [ ] Flujo de invitación
- [ ] Flujo de pago

### 10.3 Tests Manuales
- [ ] Registrar nuevo coach
- [ ] Onboarding completo
- [ ] Agregar estudiantes
- [ ] Procesar suscripciones
- [ ] Verificar comisiones
- [ ] Probar límites de plan
- [ ] Probar upgrade/downgrade
- [ ] Probar cancelación

### 10.4 Tests de Regresión
- [ ] Verificar funcionalidades existentes no se rompieron
- [ ] Verificar usuarios existentes pueden seguir usando la app
- [ ] Verificar suscripciones existentes siguen funcionando

---

## 📅 FASE 11: DEPLOY Y MONITOREO (Semana 7-8)

### 11.1 Pre-Deploy
- [ ] Code review completo
- [ ] Documentación actualizada
- [ ] Changelog creado
- [ ] Plan de rollback preparado

### 11.2 Deploy
- [ ] Deploy a staging
- [ ] Tests en staging
- [ ] Deploy a producción
- [ ] Verificar que todo funciona

### 11.3 Post-Deploy
- [ ] Monitoreo de errores
- [ ] Métricas de adopción
- [ ] Feedback de usuarios
- [ ] Correcciones urgentes

---

## 🔍 Validaciones Finales

### Funcionalidad Core
- [ ] Coaches pueden registrarse
- [ ] Coaches pueden seleccionar plan
- [ ] Coaches pueden agregar estudiantes
- [ ] Estudiantes pueden suscribirse
- [ ] Comisiones se calculan correctamente
- [ ] Límites de plan se respetan

### Seguridad
- [ ] Coaches no pueden ver estudiantes de otros coaches
- [ ] Students no pueden ver datos de otros students
- [ ] Validaciones de permisos funcionan
- [ ] No hay vulnerabilidades de seguridad

### Performance
- [ ] Queries optimizadas
- [ ] Paginación funciona
- [ ] No hay N+1 queries
- [ ] Carga rápida de dashboards

### UX
- [ ] Onboarding claro
- [ ] Navegación intuitiva
- [ ] Mensajes de error claros
- [ ] Responsive en móvil

---

## 📊 Métricas a Monitorear Post-Launch

- [ ] Número de coaches registrados
- [ ] Número de estudiantes por coach (promedio)
- [ ] Tasa de conversión: registro → plan activo
- [ ] Churn rate de coaches
- [ ] Comisiones generadas
- [ ] Errores reportados
- [ ] Tiempo de carga de páginas

---

## 🚨 Plan de Rollback

Si algo sale mal:

1. [ ] Tener backup de base de datos listo
2. [ ] Script de rollback de migración
3. [ ] Feature flags para desactivar funcionalidades nuevas
4. [ ] Comunicación con usuarios si es necesario

---

**Nota**: Marca cada ítem cuando lo completes. Este checklist debe actualizarse según avances y cambios en el plan.

