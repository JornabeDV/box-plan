# 🧪 Guía de Testing - Box Plan

## 📋 Estado Actual del Testing

**Última actualización:** Enero 2026
**Framework:** Jest + Testing Library + MSW
**Cobertura:** Tests unitarios e integración

---

## 🎯 Infraestructura de Testing

### ✅ Configuración Completada

#### **Dependencias Instaladas**
```json
{
  "@testing-library/react": "^16.3.2",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "jest-fetch-mock": "^3.0.3",
  "msw": "^2.12.7",
  "web-streams-polyfill": "^4.2.0",
  "sqlite3": "^5.1.7"
}
```

#### **Archivos de Configuración**
- `jest.config.js` - Configuración principal de Jest
- `jest.setup.js` - Setup global y mocks
- `jest.polyfills.js` - Polyfills para APIs del navegador
- `__tests__/utils/test-utils.tsx` - Utilidades de testing
- `__tests__/utils/db-test-setup.ts` - Configuración de BD de testing
- `__tests__/fixtures/test-data.ts` - Datos de prueba

#### **Scripts Disponibles**
```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Ejecutar tests con cobertura
pnpm test:coverage

# Ejecutar tests de CI (sin watch)
pnpm test:ci
```

---

## ✅ Tests Implementados

### **1. Hooks - useCoachMotivationalQuotes**

**Archivo:** `hooks/__tests__/use-coach-motivational-quotes.test.tsx`
**Estado:** ✅ **COMPLETADO**
**Cobertura:** 5 tests pasando

#### **Escenarios Probados:**
- ✅ Carga exitosa de frases motivacionales
- ✅ Manejo de arrays vacíos
- ✅ Manejo de errores de API
- ✅ Manejo de errores de red
- ✅ Funcionalidad de refetch

#### **Código de Ejemplo:**
```typescript
it('should handle API response with quotes', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ quotes: ['Frase 1', 'Frase 2'] }),
  })

  const { result } = renderHook(() => useCoachMotivationalQuotes())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.quotes).toEqual(['Frase 1', 'Frase 2'])
})
```

### **3. APIs - POST /api/auth/register**

**Archivo:** `app/api/auth/__tests__/register.test.ts`
**Estado:** ✅ **COMPLETADO**
**Cobertura:** 7 tests pasando

#### **Escenarios Probados:**
- ✅ Registro exitoso de usuario nuevo
- ✅ Validación de campos requeridos (email/password)
- ✅ Prevención de emails duplicados
- ✅ Manejo de errores de base de datos
- ✅ Manejo de errores de hashing bcrypt
- ✅ Soporte opcional para teléfono
- ✅ Manejo de JSON malformado

#### **Funcionalidad Crítica Validada:**
- **Validación de entrada** y sanitización
- **Hashing seguro de contraseñas** con bcrypt
- **Transacciones de base de datos** atómicas
- **Creación de roles por defecto** ('user')
- **Manejo robusto de errores** con logging
- **Respuestas HTTP apropiadas** (200, 400, 409, 500)

#### **Código de Ejemplo:**
```typescript
it('should register a new user successfully', async () => {
  // Mock database and bcrypt
  mockPrisma.user.findUnique.mockResolvedValue(null)
  mockBcrypt.hash.mockResolvedValue('hashed_password')

  const request = new Request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }),
    headers: { 'content-type': 'application/json' }
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
  expect(data.userId).toBeDefined()
})
```

### **2. Hooks - useAuthWithRoles**

**Archivo:** `hooks/__tests__/use-auth-with-roles.test.tsx`
**Estado:** ✅ **COMPLETADO**
**Cobertura:** 6 tests pasando

#### **Escenarios Probados:**
- ✅ Estados iniciales (loading, no autenticado)
- ✅ Carga exitosa de roles de usuario con perfiles
- ✅ Manejo de errores de API
- ✅ Prevención de llamadas duplicadas
- ✅ Manejo de logout y cambios de sesión
- ✅ Propiedades computadas (isAdmin, isCoach, etc.)

#### **Funcionalidad Crítica Validada:**
- **Gestión de estados de autenticación**
- **Carga de roles desde API**
- **Manejo de perfiles específicos** (admin/coach)
- **Prevención de race conditions**
- **Limpieza de estado en logout**

#### **Código de Ejemplo:**
```typescript
it('should load coach role and profile for authenticated coach user', async () => {
  const mockSession = createMockSession()

  mockUseSession.mockReturnValue({
    data: mockSession,
    status: 'authenticated',
    update: jest.fn(),
  })

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      role: { id: '1', user_id: '1', role: 'coach', ... },
      coachProfile: { id: 1, businessName: 'Test Gym', ... }
    })
  })

  const { result } = renderHook(() => useAuthWithRoles())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.userRole?.role).toBe('coach')
  expect(result.current.isCoach).toBe(true)
  expect(result.current.coachProfile?.businessName).toBe('Test Gym')
})
```

---

## 🔄 Tests en Desarrollo

### **3. APIs - POST /api/auth/register**

**Archivo:** `app/api/auth/__tests__/register.test.ts`
**Estado:** ✅ **COMPLETADO**
**Cobertura:** 7 tests pasando

#### **Escenarios Probados:**
- ✅ Registro exitoso de usuario nuevo
- ✅ Validación de campos requeridos (email/password)
- ✅ Prevención de emails duplicados
- ✅ Manejo de errores de base de datos
- ✅ Manejo de errores de hashing bcrypt
- ✅ Soporte opcional para teléfono
- ✅ Manejo de JSON malformado

#### **Funcionalidad Crítica Validada:**
- **Validación de entrada** y sanitización
- **Hashing seguro de contraseñas** con bcrypt
- **Transacciones de base de datos** atómicas
- **Creación de roles por defecto** ('user')
- **Manejo robusto de errores** con logging
- **Respuestas HTTP apropiadas** (200, 400, 409, 500)

#### **Código de Ejemplo:**
```typescript
it('should register a new user successfully', async () => {
  // Mock database and bcrypt
  mockPrisma.user.findUnique.mockResolvedValue(null)
  mockBcrypt.hash.mockResolvedValue('hashed_password')

  const request = new Request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }),
    headers: { 'content-type': 'application/json' }
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
  expect(data.userId).toBeDefined()
})
```

### **4. APIs - GET /api/user-role**

**Archivo:** `app/api/user-role/__tests__/route.test.ts`
**Estado:** ✅ **COMPLETADO**
**Cobertura:** 10 tests pasando

#### **Escenarios Probados:**
- ✅ **Autenticación requerida** - Manejo de usuarios no autenticados
- ✅ **Roles de usuario** - Carga de diferentes tipos de roles (user, admin, coach)
- ✅ **Perfiles condicionales** - Carga de adminProfile y coachProfile según rol
- ✅ **Carga en paralelo** - Optimización de consultas con Promise.all
- ✅ **Ordenamiento por fecha** - Obtención del rol más reciente
- ✅ **Manejo de errores** - Errores de base de datos y autenticación
- ✅ **Headers de cache** - Configuración apropiada de cache-control
- ✅ **Casos edge** - Usuario sin rol, sesión incompleta

#### **Funcionalidad Crítica Validada:**
- **Autenticación con NextAuth** - Integración completa con auth()
- **Optimización de consultas** - Carga condicional y paralela de datos
- **Seguridad de caché** - Headers apropiados para evitar stale data
- **Manejo de roles múltiples** - Soporte para usuarios con múltiples roles
- **Serialización correcta** - Fechas y datos correctamente formateados
- **Error boundaries** - Manejo robusto de errores de DB y auth

#### **Código de Ejemplo:**
```typescript
it('should return role and coach profile for coach user', async () => {
  // Mock authenticated session
  mockAuth.mockResolvedValue({
    user: { id: '3', email: 'coach@example.com' }
  })
  mockNormalizeUserId.mockReturnValue(3)

  // Mock database responses
  mockPrisma.userRole.findFirst.mockResolvedValue({
    id: '3', userId: 3, role: 'coach',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  mockPrisma.coachProfile.findUnique.mockResolvedValue({
    id: 1, userId: 3, businessName: 'Test Gym',
    // ... otros campos
  })

  const response = await GET(new Request('/api/user-role'))
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.role.role).toBe('coach')
  expect(data.coachProfile.businessName).toBe('Test Gym')
  expect(data.adminProfile).toBeNull()

  // Verify cache headers
  expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate')
})
```

### **2. Hooks - useAuthWithRoles**

**Archivo:** `hooks/__tests__/use-auth-with-roles.test.tsx`
**Estado:** 🔄 **EN DESARROLLO**
**Prioridad:** 🔴 CRÍTICA

#### **Escenarios a Probar:**
- ✅ Estados iniciales (loading, no autenticado)
- ✅ Carga exitosa de roles de usuario
- ✅ Manejo de errores de API
- ✅ Prevención de llamadas duplicadas
- ✅ Gestión de sesiones expiradas
- 🔄 Override de roles (funcionalidad avanzada)

#### **Código Actual:**
```typescript
describe('useAuthWithRoles', () => {
  it('should return loading state initially', () => {
    // Test implementation
  })
  // ... más tests
})
```

---

## 📋 Plan de Testing Completo

### **🔴 PRIORIDAD CRÍTICA** (Implementar primero)

#### **3. APIs de Autenticación**
**Archivos:** `app/api/auth/*/route.ts`
**Estado:** 📝 **PLANIFICADO**

| API | Archivo | Estado | Tests Necesarios |
|-----|---------|--------|------------------|
| Register | `app/api/auth/register/route.ts` | 🔄 En desarrollo | 6 tests |
| Login | `app/api/auth/login/route.ts` | 📝 Pendiente | 4 tests |
| Forgot Password | `app/api/auth/forgot-password/route.ts` | 📝 Pendiente | 3 tests |
| Reset Token | `app/api/auth/validate-reset-token/route.ts` | 📝 Pendiente | 2 tests |

#### **4. Hooks de Dashboard**
**Archivos:** `hooks/use-dashboard-*.ts`
**Estado:** 📝 **PLANIFICADO**

| Hook | Archivo | Estado | Prioridad |
|------|---------|--------|-----------|
| `useAuthWithRoles` | `hooks/use-auth-with-roles.ts` | ✅ Completado | 🔴 Crítica |
| `useDashboardData` | `hooks/use-dashboard-data.ts` | 📝 Pendiente | 🔴 Crítica |
| `useCoachPlanFeatures` | `hooks/use-coach-plan-features.ts` | 🔄 En desarrollo | 🔴 Crítica |

---

### **🟡 PRIORIDAD ALTA** (Próximas 2 semanas)

#### **5. APIs de Coaches**
**Archivos:** `app/api/coaches/*/route.ts`

| Funcionalidad | Estado | Tests Estimados |
|---------------|--------|-----------------|
| Gestión de estudiantes | 📝 Pendiente | 8 tests |
| Planificación de entrenamientos | 📝 Pendiente | 12 tests |
| Gestión de disciplinas | 📝 Pendiente | 6 tests |

#### **6. APIs de Pagos**
**Archivos:** `app/api/mercadopago/*/route.ts`

| Funcionalidad | Estado | Tests Estimados |
|---------------|--------|-----------------|
| Webhooks de MercadoPago | 📝 Pendiente | 5 tests |
| Creación de preferencias | 📝 Pendiente | 3 tests |
| Gestión de suscripciones | 📝 Pendiente | 7 tests |

---

### **🟢 PRIORIDAD MEDIA** (Próximas 4 semanas)

#### **7. Componentes de UI**
**Archivos:** `components/*/*.tsx`

| Componente | Estado | Tests Estimados |
|------------|--------|-----------------|
| Formularios de login/registro | 📝 Pendiente | 6 tests |
| Dashboard principal | 📝 Pendiente | 8 tests |
| Calendarios de planificación | 📝 Pendiente | 4 tests |

#### **8. Utilidades y Helpers**
**Archivos:** `lib/*.ts`

| Utilidad | Estado | Tests Estimados |
|----------|--------|-----------------|
| Validaciones | 📝 Pendiente | 5 tests |
| Helpers de fecha | 📝 Pendiente | 3 tests |
| Utilidades de auth | 📝 Pendiente | 4 tests |

---

## 🔧 Configuración Técnica

### **Jest Configuration**
```javascript
// jest.config.js
module.exports = createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  // ... más configuración
})
```

### **Global Setup**
```javascript
// jest.setup.js
import '@testing-library/jest-dom'
// Mocks de Next.js, fetch, localStorage, etc.
```

### **Polyfills**
```javascript
// jest.polyfills.js
// Polyfills para Response, Request, Headers, TransformStream, etc.
```

### **Utilidades de Testing**
```typescript
// __tests__/utils/test-utils.tsx
export const customRender = // Wrapper con providers
export const createMockUser = // Factory de datos de prueba
```

---

## 📊 Métricas de Cobertura

### **Cobertura Actual**
- **Hooks:** 2/6 implementados (33%)
- **APIs:** 2/10 implementadas (20%)
- **Componentes:** 0/15 implementados (0%)
- **Utilidades:** 0/5 implementadas (0%)

### **Cobertura Objetivo**
- **Hooks:** 6/6 (100%) - Semana 2
- **APIs críticas:** 5/10 (50%) - Semana 4
- **Componentes:** 10/15 (67%) - Semana 6
- **Utilidades:** 5/5 (100%) - Semana 8

---

## 🚨 Problemas Conocidos

### **1. Polyfills Complejos**
**Problema:** Las APIs de Next.js requieren polyfills extensos
**Solución temporal:** Usar mocks directos en lugar de NextRequest/NextResponse
**Solución futura:** Implementar polyfills completos o usar testing-library/next

### **2. Base de Datos de Testing**
**Problema:** SQLite en memoria no está completamente configurado
**Solución:** Implementar setup/teardown de BD de testing

### **3. MSW Configuration**
**Problema:** MSW v2 tiene configuración compleja para Jest
**Solución:** Usar mocks directos inicialmente, MSW para tests avanzados

---

## 📝 Convenciones de Testing

### **Estructura de Tests**
```typescript
describe('Component/Hook/API Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Happy Path', () => {
    it('should handle successful scenario', async () => {
      // Arrange
      // Act
      // Assert
    })
  })

  describe('Error Cases', () => {
    it('should handle API errors gracefully', async () => {
      // Test error handling
    })
  })
})
```

### **Naming Conventions**
- Archivos: `*.test.tsx` o `*.spec.tsx`
- Tests: `should [expected behavior] when [condition]`
- Mocks: `mock[ServiceName]`

### **Testing Patterns**
- ✅ **Arrange-Act-Assert** pattern
- ✅ **Mock external dependencies**
- ✅ **Test one thing per test**
- ✅ **Use descriptive test names**
- ✅ **Test error cases**

---

## 🎯 Próximos Pasos

### **Semana 1** (Esta semana) ✅ COMPLETADA
- [x] Configurar infraestructura de testing
- [x] Implementar tests de `useCoachMotivationalQuotes`
- [x] Completar tests de `useAuthWithRoles`
- [x] Resolver problemas de polyfills con mocks directos

### **Semana 2** (Esta semana - Continuación) ✅ APIs DE AUTENTICACIÓN COMPLETADAS
- [x] Tests de API `POST /api/auth/register` (7 tests)
- [x] Tests de API `GET /api/user-role` (10 tests)
- [ ] Tests de `useDashboardData`
- [ ] Tests de `useCoachPlanFeatures`
- [ ] Configurar CI/CD básico

### **Semana 3-4**
- [ ] Tests de APIs de coaches y pagos
- [ ] Tests de componentes críticos
- [ ] Implementar CI/CD con tests

---

## 📚 Recursos y Referencias

### **Documentación**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)

### **Ejemplos en el Código**
- `hooks/__tests__/use-coach-motivational-quotes.test.tsx` - Ejemplo completo
- `__tests__/utils/test-utils.tsx` - Utilidades de testing
- `__tests__/fixtures/test-data.ts` - Datos de prueba

### **Comandos Útiles**
```bash
# Ver tests fallidos específicamente
pnpm test --testPathPattern=auth

# Ejecutar solo tests de hooks
pnpm test hooks/

# Generar reporte de cobertura
pnpm test:coverage
```

---

## 📞 Contacto y Mantenimiento

**Mantenedor:** Equipo de Desarrollo Box Plan
**Última revisión:** Enero 2026

Para agregar nuevos tests:
1. Crear archivo en `__tests__/`
2. Seguir convenciones establecidas
3. Actualizar esta documentación
4. Ejecutar `pnpm test` para validar

---

*Esta documentación se actualiza con cada nueva implementación de tests.*
