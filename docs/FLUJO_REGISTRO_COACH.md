# Flujo Completo de Registro e Ingreso de un Coach Nuevo

## 📋 Resumen del Flujo

Un coach nuevo que no está registrado y no ha seleccionado ningún plan sigue este proceso:

---

## 🚀 PASO 1: Llegada a la Plataforma

**URL**: El coach accede a `/register/coach` o hace clic en "Regístrate como coach" desde la página de login.

**Estado**: No autenticado, no registrado.

---

## 📝 PASO 2: Formulario de Registro

**Página**: `/register/coach` (`app/register/coach/page.tsx`)

**Componente**: `CoachSignUpForm` (`components/auth/coach-signup-form.tsx`)

**Campos del formulario**:
- Nombre Completo *
- Email *
- Contraseña * (mínimo 6 caracteres)
- Confirmar Contraseña *
- Nombre del Negocio (opcional)
- Teléfono (opcional)
- Dirección (opcional)

**Validaciones**:
- Las contraseñas deben coincidir
- La contraseña debe tener al menos 6 caracteres
- El email no debe estar registrado previamente

---

## 💾 PASO 3: Procesamiento del Registro

**API**: `POST /api/coaches/register` (`app/api/coaches/register/route.ts`)

**Lo que sucede en el backend**:

1. **Validación de datos**: Verifica que email y contraseña estén presentes
2. **Verificación de duplicados**: Comprueba que el email no esté registrado
3. **Hash de contraseña**: Encripta la contraseña con bcrypt
4. **Cálculo de período de prueba**: 
   ```javascript
   const trialEndsAt = new Date()
   trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 días desde ahora
   ```
5. **Creación en base de datos**:
   - Crea un `User` con email, password hasheado y nombre
   - Crea un `UserRole` con rol `'coach'`
   - Crea un `CoachProfile` con:
     - `businessName`, `phone`, `address` (opcionales)
     - `maxStudents: 10` (valor por defecto)
     - `commissionRate: 12.00` (valor por defecto)
     - **`trialEndsAt`**: Fecha de fin del período de prueba (7 días)

**Resultado**: 
- ✅ Cuenta creada exitosamente
- ✅ Período de prueba de 7 días activado automáticamente
- ❌ **IMPORTANTE**: El coach NO está autenticado aún

---

## 🔄 PASO 4: Redirección Después del Registro

**Después del registro exitoso**:

1. El formulario muestra un mensaje de éxito: "¡Cuenta de coach creada exitosamente!"
2. Después de 2 segundos, redirige automáticamente a: `/pricing/coaches`

**Estado actual**:
- ✅ Cuenta creada en la base de datos
- ✅ Período de prueba activo (7 días)
- ❌ **NO está autenticado** (no hay sesión activa)

---

## 💳 PASO 5: Página de Planes (Sin Autenticación)

**URL**: `/pricing/coaches` (`app/pricing/coaches/page.tsx`)

**Lo que ve el coach**:
- Lista de planes disponibles (Starter, Growth, Enterprise)
- Precios, límites de estudiantes, comisiones
- Características de cada plan
- Botón "Seleccionar Plan" en cada tarjeta

**Comportamiento actual**:
- Si hace clic en "Seleccionar Plan" sin estar autenticado:
  - Se redirige a `/login?redirect=/pricing/coaches`
  - Después del login, volverá a esta página

**IMPORTANTE**: El coach puede:
- ✅ Ver los planes disponibles
- ✅ Decidir cuál plan quiere
- ❌ NO puede seleccionar un plan sin estar autenticado
- ⚠️ **NO necesita seleccionar un plan inmediatamente** - Tiene 7 días de prueba gratis

---

## 🔐 PASO 6: Primer Login

**URL**: `/login` (`app/login/page.tsx`)

**El coach**:
1. Ingresa su email y contraseña (las que usó en el registro)
2. Hace clic en "Iniciar Sesión"

**Procesamiento**:
- NextAuth valida las credenciales
- Crea una sesión
- Obtiene el rol del usuario (`'coach'`)

**Redirección automática**:
- Como el rol es `'coach'`, se redirige a: `/admin-dashboard`
- **NO** va a `/pricing/coaches` (a menos que haya un redirect param)

---

## 🎯 PASO 7: Acceso al Dashboard (Con Período de Prueba)

**URL**: `/admin-dashboard` (`app/admin-dashboard/page.tsx`)

**Validaciones que se ejecutan**:

1. **Verificación de autenticación**: ¿Está logueado?
2. **Verificación de rol**: ¿Es coach?
3. **Verificación de acceso**: ¿Tiene suscripción activa O período de prueba válido?

**API llamada**: `GET /api/coaches/access` (`app/api/coaches/access/route.ts`)

**Lógica de acceso** (`lib/coach-helpers.ts`):
```typescript
// 1. Busca suscripción activa
if (tiene suscripción activa) {
  return { hasAccess: true, isTrial: false }
}

// 2. Si no tiene suscripción, verifica período de prueba
if (trialEndsAt > fecha actual) {
  return { hasAccess: true, isTrial: true, daysRemaining: X }
}

// 3. Si no tiene ni suscripción ni período válido
return { hasAccess: false }
```

**Lo que ve el coach**:

### Si tiene período de prueba activo (días restantes > 0):

1. **Banner informativo** en la parte superior:
   - Si quedan más de 2 días: Banner azul
   - Si quedan 2 días o menos: Banner amarillo (advertencia)
   - Muestra: "Período de prueba: X días restantes"
   - Botón: "Seleccionar Plan" (redirige a `/pricing/coaches`)

2. **Dashboard completo** con acceso a:
   - ✅ Ver y gestionar disciplinas
   - ✅ Crear y editar planificaciones
   - ✅ Gestionar usuarios/estudiantes
   - ✅ Ver estadísticas
   - ✅ Gestionar planes de suscripción
   - ✅ Todas las funcionalidades disponibles

### Si el período de prueba terminó (días restantes = 0):

**Pantalla de bloqueo**:
- Mensaje: "Período de Prueba Finalizado"
- Texto: "Tu período de prueba gratuito de 7 días ha terminado. Para continuar usando Box Plan con tus estudiantes, necesitas seleccionar un plan."
- Botón: "Ver Planes y Precios" → Redirige a `/pricing/coaches`
- ❌ **NO puede acceder al dashboard** hasta que seleccione un plan

---

## 📊 RESUMEN DEL FLUJO COMPLETO

```
1. Coach llega a /register/coach
   ↓
2. Llena formulario de registro
   ↓
3. POST /api/coaches/register
   - Crea User
   - Crea CoachProfile con trialEndsAt = hoy + 7 días
   - NO autentica al usuario
   ↓
4. Redirección a /pricing/coaches
   - Ve los planes disponibles
   - Puede decidir cuál quiere
   - NO está autenticado aún
   ↓
5. Coach hace clic en "Iniciar Sesión" o va a /login
   ↓
6. Ingresa email y contraseña
   ↓
7. NextAuth autentica y crea sesión
   ↓
8. Redirección automática a /admin-dashboard
   ↓
9. Dashboard verifica acceso:
   - GET /api/coaches/access
   - Verifica: ¿tiene suscripción activa? NO
   - Verifica: ¿trialEndsAt > hoy? SÍ (tiene 7 días)
   ↓
10. Dashboard muestra:
    - Banner: "Período de prueba: 7 días restantes"
    - Acceso completo a todas las funcionalidades
    - Botón para seleccionar plan cuando quiera
```

---

## ⚠️ PUNTOS IMPORTANTES

### 1. **No necesita seleccionar plan inmediatamente**
- El coach puede usar el sistema durante 7 días sin pagar
- Puede seleccionar un plan en cualquier momento durante esos 7 días
- El banner le recuerda que tiene días restantes

### 2. **Después de 7 días**
- Si no seleccionó un plan, pierde acceso al dashboard
- Debe seleccionar un plan para continuar
- Una vez que selecciona un plan, el período de prueba ya no es relevante (tiene suscripción activa)

### 3. **Flujo de selección de plan** (cuando decida hacerlo)
- Va a `/pricing/coaches`
- Selecciona un plan
- Se procesa el pago (MercadoPago)
- Se crea `CoachSubscription` con status `'active'`
- Ahora tiene acceso permanente (mientras la suscripción esté activa)

---

## 🔧 Mejoras Sugeridas al Flujo Actual

### Problema identificado:
Después del registro, el coach NO está autenticado automáticamente, entonces:
1. Se redirige a `/pricing/coaches` sin estar logueado
2. Si quiere usar el dashboard, debe hacer login manualmente
3. Después del login, va directo al dashboard (no a pricing)

### Solución recomendada:
**Opción A**: Autenticar automáticamente después del registro
- Después de crear la cuenta, iniciar sesión automáticamente
- Redirigir directamente al dashboard
- Mostrar un mensaje de bienvenida con información del período de prueba

**Opción B**: Mejorar la redirección después del login
- Si el coach viene de `/pricing/coaches`, mantener el redirect
- Si no tiene suscripción activa pero tiene período de prueba, mostrar banner en dashboard

---

## 📝 Notas Técnicas

- El período de prueba se calcula automáticamente al crear el `CoachProfile`
- La validación de acceso se hace en cada carga del dashboard
- El banner se actualiza dinámicamente según los días restantes
- Si el coach selecciona un plan durante el período de prueba, la suscripción activa tiene prioridad sobre el período de prueba


