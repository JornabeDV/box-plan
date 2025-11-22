# Arquitectura de Pagos B2B2C - Box Plan

## 📋 Resumen Ejecutivo

Este documento describe cómo manejar los pagos en un modelo de marketplace donde:
1. **Coaches pagan a la plataforma** por su suscripción mensual/anual
2. **Estudiantes pagan a sus coaches** (a través de la plataforma)
3. **La plataforma recibe un porcentaje** de cada transacción estudiante → coach

---

## 💰 Modelo de Flujo de Dinero

### Flujo 1: Coach → Plataforma (Suscripción del Coach)

```
Coach paga $15,000 ARS/mes → 100% va a la plataforma
```

**Ejemplo:**
- Coach con plan **Starter** paga $15,000 ARS/mes
- El dinero va **completamente a la plataforma**
- No hay comisión para el coach en este flujo

### Flujo 2: Estudiante → Coach (Suscripción del Estudiante)

```
Estudiante paga $10,000 ARS/mes → Se divide:
- X% al Coach (ej: 88%)
- Y% a la Plataforma (ej: 12%)
```

**Ejemplo:**
- Estudiante paga $10,000 ARS/mes por su plan
- Coach recibe: $10,000 × 88% = **$8,800 ARS**
- Plataforma recibe: $10,000 × 12% = **$1,200 ARS**

---

## 🏗️ Arquitectura de Datos

### Tablas Clave

#### 1. `CoachProfile`
```prisma
model CoachProfile {
  commissionRate      Decimal   @default(12.00)  // % que recibe el COACH
  platformCommissionRate Decimal @default(12.00) // % que recibe la PLATAFORMA
  // ...
}
```

**Nota importante**: 
- `commissionRate` = Porcentaje que **recibe el coach** (ej: 88%)
- `platformCommissionRate` = Porcentaje que **recibe la plataforma** (ej: 12%)
- **Deben sumar 100%**: `commissionRate + platformCommissionRate = 100%`

#### 2. `CoachCommission`
```prisma
model CoachCommission {
  commissionAmount          Decimal   // Dinero que recibe el COACH
  platformCommissionAmount Decimal   // Dinero que recibe la PLATAFORMA
  studentSubscriptionAmount Decimal   // Monto total pagado por el estudiante
  commissionRate            Decimal   // % del coach (ej: 88%)
  platformCommissionRate    Decimal   // % de la plataforma (ej: 12%)
  // ...
}
```

#### 3. `PaymentHistory` (Nuevo campo)
```prisma
model PaymentHistory {
  // ... campos existentes
  recipientType String?  // 'platform', 'coach', 'student'
  recipientId   Int?     // ID del coach o null si es plataforma
  splitAmount   Decimal? // Monto específico si es split payment
}
```

---

## 🔄 Flujos de Pago Detallados

### Escenario 1: Coach se Suscribe a la Plataforma

**Proceso:**
1. Coach selecciona plan (Starter, Growth, Enterprise)
2. Se crea `CoachSubscription` con `CoachPlanType`
3. Pago va 100% a la plataforma
4. Se registra en `PaymentHistory` con `recipientType: 'platform'`

**Código:**
```typescript
// app/api/coaches/[coachId]/subscription/route.ts
const coachSubscription = await prisma.coachSubscription.create({
  data: {
    coachId,
    planId: coachPlanTypeId,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: calculatePeriodEnd(),
    mercadopagoPaymentId: paymentId
  }
})

// Registrar pago (100% a plataforma)
await prisma.paymentHistory.create({
  data: {
    userId: coachUserId,
    amount: coachPlanType.basePrice,
    currency: 'ARS',
    status: 'approved',
    recipientType: 'platform',
    paymentMethod: 'mercadopago'
  }
})
```

### Escenario 2: Estudiante se Suscribe al Coach

**Proceso:**
1. Estudiante selecciona plan del coach (`SubscriptionPlan` con `coachId`)
2. Estudiante paga el monto completo
3. **Split automático**:
   - Calcular comisión del coach
   - Calcular comisión de la plataforma
   - Crear registro en `CoachCommission`
4. Registrar en `PaymentHistory` (split)

**Código:**
```typescript
// app/api/subscriptions/route.ts (modificar)
async function createStudentSubscription(data) {
  const { userId, planId, coachId } = data
  
  // Obtener plan y coach
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { coach: true }
  })
  
  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId }
  })
  
  // Calcular split
  const totalAmount = Number(plan.price)
  const coachCommissionRate = Number(coach.commissionRate) / 100 // ej: 0.88
  const platformCommissionRate = Number(coach.platformCommissionRate) / 100 // ej: 0.12
  
  const coachAmount = totalAmount * coachCommissionRate
  const platformAmount = totalAmount * platformCommissionRate
  
  // Crear suscripción y comisiones en transacción
  return await prisma.$transaction(async (tx) => {
    // 1. Crear suscripción del estudiante
    const subscription = await tx.subscription.create({
      data: {
        userId,
        planId,
        coachId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEnd()
      }
    })
    
    // 2. Crear comisión del coach
    const commission = await tx.coachCommission.create({
      data: {
        coachId,
        studentSubscriptionId: subscription.id,
        studentId: userId,
        commissionAmount: coachAmount,
        commissionRate: coach.commissionRate,
        platformCommissionAmount: platformAmount,
        platformCommissionRate: coach.platformCommissionRate,
        studentSubscriptionAmount: totalAmount,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        status: 'pending'
      }
    })
    
    // 3. Actualizar totalEarnings del coach
    await tx.coachProfile.update({
      where: { id: coachId },
      data: {
        totalEarnings: {
          increment: coachAmount
        }
      }
    })
    
    // 4. Registrar pagos en PaymentHistory
    // Pago del estudiante (total)
    await tx.paymentHistory.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: totalAmount,
        currency: plan.currency,
        status: 'approved',
        recipientType: 'student',
        paymentMethod: 'mercadopago'
      }
    })
    
    // Comisión del coach
    await tx.paymentHistory.create({
      data: {
        userId: coach.userId,
        amount: coachAmount,
        currency: plan.currency,
        status: 'approved',
        recipientType: 'coach',
        recipientId: coachId,
        splitAmount: coachAmount,
        paymentMethod: 'mercadopago'
      }
    })
    
    // Comisión de la plataforma
    await tx.paymentHistory.create({
      data: {
        userId: userId, // Usuario que originó el pago
        amount: platformAmount,
        currency: plan.currency,
        status: 'approved',
        recipientType: 'platform',
        splitAmount: platformAmount,
        paymentMethod: 'mercadopago'
      }
    })
    
    return { subscription, commission }
  })
}
```

---

## 📊 Ejemplos Prácticos

### Ejemplo 1: Coach Starter con 5 Estudiantes

**Coach:**
- Plan: Starter ($15,000 ARS/mes)
- Comisión: 88% (recibe)
- Plataforma: 12% (recibe)

**Estudiantes:**
- 5 estudiantes, cada uno paga $10,000 ARS/mes

**Cálculo Mensual:**

```
Ingresos del Coach:
- Pago de suscripción propia: -$15,000 (gasto)
- Comisiones de estudiantes: 5 × ($10,000 × 88%) = $44,000
- Total neto: $29,000 ARS/mes

Ingresos de la Plataforma:
- Suscripción del coach: $15,000
- Comisiones de estudiantes: 5 × ($10,000 × 12%) = $6,000
- Total: $21,000 ARS/mes
```

### Ejemplo 2: Coach Growth con 20 Estudiantes

**Coach:**
- Plan: Growth ($25,000 ARS/mes)
- Comisión: 90% (recibe)
- Plataforma: 10% (recibe)

**Estudiantes:**
- 20 estudiantes, cada uno paga $10,000 ARS/mes

**Cálculo Mensual:**

```
Ingresos del Coach:
- Pago de suscripción propia: -$25,000 (gasto)
- Comisiones de estudiantes: 20 × ($10,000 × 90%) = $180,000
- Total neto: $155,000 ARS/mes

Ingresos de la Plataforma:
- Suscripción del coach: $25,000
- Comisiones de estudiantes: 20 × ($10,000 × 10%) = $20,000
- Total: $45,000 ARS/mes
```

---

## 🔧 Implementación Técnica

### 1. Actualizar Schema de Prisma

```prisma
model CoachProfile {
  // ... campos existentes
  commissionRate           Decimal   @default(88.00) @map("commission_rate") @db.Decimal(5, 2)
  platformCommissionRate   Decimal   @default(12.00) @map("platform_commission_rate") @db.Decimal(5, 2)
  // ...
}

model CoachCommission {
  // ... campos existentes
  platformCommissionAmount Decimal?  @map("platform_commission_amount") @db.Decimal(10, 2)
  platformCommissionRate   Decimal?  @map("platform_commission_rate") @db.Decimal(5, 2)
  // ...
}

model PaymentHistory {
  // ... campos existentes
  recipientType String?   @map("recipient_type") @db.VarChar(20) // 'platform', 'coach', 'student'
  recipientId   Int?       @map("recipient_id") // ID del coach si recipientType = 'coach'
  splitAmount   Decimal?   @map("split_amount") @db.Decimal(10, 2)
  // ...
}
```

### 2. Función Helper para Calcular Split

```typescript
// lib/payment-helpers.ts
export interface PaymentSplit {
  totalAmount: number
  coachAmount: number
  platformAmount: number
  coachRate: number
  platformRate: number
}

export function calculatePaymentSplit(
  totalAmount: number,
  coachCommissionRate: number,
  platformCommissionRate: number
): PaymentSplit {
  // Validar que sumen 100%
  const totalRate = coachCommissionRate + platformCommissionRate
  if (Math.abs(totalRate - 100) > 0.01) {
    throw new Error('Las comisiones deben sumar 100%')
  }
  
  const coachRate = coachCommissionRate / 100
  const platformRate = platformCommissionRate / 100
  
  return {
    totalAmount,
    coachAmount: totalAmount * coachRate,
    platformAmount: totalAmount * platformRate,
    coachRate: coachCommissionRate,
    platformRate: platformCommissionRate
  }
}
```

### 3. Actualizar Webhook de MercadoPago

```typescript
// app/api/webhooks/mercadopago/route.ts
async function handleStudentPayment(payment: any) {
  const { user_id, plan_id, coach_id } = payment.metadata || {}
  
  if (!coach_id) {
    // Pago directo a plataforma (sin coach)
    return await createDirectSubscription(user_id, plan_id, payment)
  }
  
  // Pago con coach - calcular split
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: parseInt(plan_id) },
    include: { coach: true }
  })
  
  const coach = await prisma.coachProfile.findUnique({
    where: { id: parseInt(coach_id) }
  })
  
  const split = calculatePaymentSplit(
    Number(plan.price),
    Number(coach.commissionRate),
    Number(coach.platformCommissionRate)
  )
  
  // Crear suscripción y comisiones
  await createStudentSubscriptionWithSplit({
    userId: parseInt(user_id),
    planId: parseInt(plan_id),
    coachId: parseInt(coach_id),
    payment,
    split
  })
}
```

### 4. API para Reportes de Ingresos

```typescript
// app/api/admin/revenue/route.ts
export async function GET(request: NextRequest) {
  // Ingresos de la plataforma
  const platformRevenue = await prisma.paymentHistory.aggregate({
    where: {
      recipientType: 'platform',
      status: 'approved',
      createdAt: {
        gte: startOfMonth(),
        lte: endOfMonth()
      }
    },
    _sum: {
      amount: true
    }
  })
  
  // Ingresos de coaches
  const coachRevenue = await prisma.paymentHistory.aggregate({
    where: {
      recipientType: 'coach',
      status: 'approved',
      createdAt: {
        gte: startOfMonth(),
        lte: endOfMonth()
      }
    },
    _sum: {
      amount: true
    }
  })
  
  return NextResponse.json({
    platform: {
      total: platformRevenue._sum.amount,
      fromCoachSubscriptions: /* ... */,
      fromStudentCommissions: /* ... */
    },
    coaches: {
      total: coachRevenue._sum.amount,
      totalCommissions: /* ... */
    }
  })
}
```

---

## 🎯 Estrategias de Comisión

### Opción A: Comisión Fija por Plan de Coach

```typescript
// Plan Starter: Coach recibe 88%, Plataforma 12%
// Plan Growth: Coach recibe 90%, Plataforma 10%
// Plan Enterprise: Coach recibe 92%, Plataforma 8%

const COMMISSION_RATES = {
  starter: { coach: 88, platform: 12 },
  growth: { coach: 90, platform: 10 },
  enterprise: { coach: 92, platform: 8 }
}
```

### Opción B: Comisión Variable por Volumen

```typescript
// Coach recibe más % si tiene más estudiantes
function calculateCommissionRate(studentCount: number) {
  if (studentCount <= 10) {
    return { coach: 88, platform: 12 }
  } else if (studentCount <= 50) {
    return { coach: 90, platform: 10 }
  } else {
    return { coach: 92, platform: 8 }
  }
}
```

### Opción C: Comisión Personalizada por Coach

```typescript
// Cada coach puede tener su propia tasa (negociada)
// Se almacena en CoachProfile.commissionRate
```

**Recomendación**: Empezar con **Opción A** (fija por plan), luego evolucionar a **Opción C** para coaches premium.

---

## 💳 Procesamiento de Pagos

### Opción 1: Split en MercadoPago (Recomendado)

MercadoPago soporta **split de pagos** nativo:

```typescript
// app/api/create-payment-preference/route.ts
const preferenceData = {
  items: [/* ... */],
  split: {
    enabled: true,
    rules: [
      {
        type: 'percentage',
        value: 12, // 12% a la plataforma
        recipient_id: process.env.MERCADOPAGO_PLATFORM_ACCOUNT_ID
      },
      {
        type: 'percentage',
        value: 88, // 88% al coach
        recipient_id: coach.mercadopagoAccountId
      }
    ]
  }
}
```

**Ventajas:**
- MercadoPago maneja el split automáticamente
- Dinero va directo a cada cuenta
- Menos complejidad en el código

**Desventajas:**
- Requiere que cada coach tenga cuenta de MercadoPago
- Configuración más compleja inicial

### Opción 2: Split Manual (Actual)

```typescript
// 1. Estudiante paga el monto completo a la plataforma
// 2. Plataforma calcula split
// 3. Plataforma transfiere comisión al coach (manual o automático)
```

**Ventajas:**
- Control total sobre los pagos
- No requiere cuentas de MercadoPago para coaches
- Más simple de implementar inicialmente

**Desventajas:**
- Requiere sistema de transferencias
- Más complejidad en el código
- Posible retraso en pagos a coaches

**Recomendación**: Empezar con **Opción 2** (split manual), luego migrar a **Opción 1** cuando haya más coaches.

---

## 📈 Dashboard de Ingresos

### Para la Plataforma (Admin)

```
Ingresos Totales del Mes: $150,000 ARS
├── Suscripciones de Coaches: $80,000 (53%)
│   ├── Starter: $30,000
│   ├── Growth: $35,000
│   └── Enterprise: $15,000
└── Comisiones de Estudiantes: $70,000 (47%)
    ├── De Coach A: $20,000
    ├── De Coach B: $25,000
    └── De Coach C: $25,000
```

### Para el Coach

```
Ingresos del Mes: $44,000 ARS
├── Comisiones de Estudiantes: $44,000
│   ├── Estudiante 1: $8,800
│   ├── Estudiante 2: $8,800
│   └── ...
└── Gastos: -$15,000
    └── Suscripción propia: -$15,000

Neto: $29,000 ARS
```

---

## 🔐 Consideraciones de Seguridad

1. **Validación de Split**: Siempre validar que `coachRate + platformRate = 100%`
2. **Transacciones Atómicas**: Usar `prisma.$transaction` para operaciones de split
3. **Auditoría**: Registrar todos los splits en `PaymentHistory`
4. **Reversiones**: Manejar cancelaciones y reembolsos correctamente

---

## 🚀 Próximos Pasos

1. **Actualizar Schema**: Agregar campos de split a Prisma
2. **Implementar Helpers**: Crear funciones de cálculo de split
3. **Modificar APIs**: Actualizar endpoints de suscripciones
4. **Actualizar Webhooks**: Manejar splits en notificaciones de pago
5. **Crear Dashboards**: Mostrar ingresos para plataforma y coaches
6. **Testing**: Probar todos los escenarios de split

---

**Última actualización**: 2025-01-XX
**Versión**: 1.0
