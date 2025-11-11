# Crear Usuarios con Prisma

## 📋 Tipos de Usuarios

El sistema soporta 4 tipos de roles:
- **`user`** - Usuario regular (estudiante/cliente)
- **`student`** - Estudiante (puede ser asignado a un coach)
- **`coach`** - Coach (tiene perfil de coach y puede tener estudiantes)
- **`admin`** - Administrador

## 🎯 1. Crear Usuario Regular (Student/User)

### Opción A: Usuario con rol 'user' (por defecto)

```typescript
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const user = await prisma.user.create({
  data: {
    email: 'estudiante@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Juan Estudiante',
    roles: {
      create: {
        role: 'user' // Rol por defecto
      }
    }
  }
})
```

### Opción B: Usuario con rol 'student'

```typescript
const student = await prisma.user.create({
  data: {
    email: 'estudiante@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Juan Estudiante',
    roles: {
      create: {
        role: 'student' // Rol específico de estudiante
      }
    }
  }
})
```

## 🏋️ 2. Crear Coach

Un coach necesita:
1. Usuario con rol `'coach'`
2. Perfil de coach (`CoachProfile`)

```typescript
const coach = await prisma.user.create({
  data: {
    email: 'coach@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Coach María',
    roles: {
      create: {
        role: 'coach'
      }
    },
    coachProfile: {
      create: {
        businessName: 'CrossFit Box',
        phone: '+5491123456789',
        address: 'Av. Corrientes 1234',
        maxStudents: 20,
        commissionRate: 15.00
      }
    }
  },
  include: {
    coachProfile: true,
    roles: true
  }
})
```

## 👨‍💼 3. Crear Admin

```typescript
const admin = await prisma.user.create({
  data: {
    email: 'admin@example.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Admin',
    roles: {
      create: {
        role: 'admin'
      }
    },
    adminProfile: {
      create: {} // AdminProfile solo necesita userId
    }
  },
  include: {
    adminProfile: true,
    roles: true
  }
})
```

## 🔐 Login

El login funciona igual para todos los tipos de usuarios. El sistema:

1. Busca el usuario por email
2. Verifica la contraseña
3. Obtiene el rol del usuario
4. Retorna la sesión con el rol correspondiente

**Ejemplo de uso del login:**

```typescript
import { signIn } from '@/lib/auth'

// En el frontend o API
const result = await signIn('credentials', {
  email: 'usuario@example.com',
  password: 'password123',
  redirect: false
})

// La sesión incluirá el rol:
// session.user.role = 'user' | 'student' | 'coach' | 'admin'
```

## 🔗 Asignar Estudiante a un Coach

Para relacionar un estudiante con un coach:

```typescript
// Primero, el estudiante debe tener rol 'student'
const student = await prisma.user.findUnique({
  where: { email: 'estudiante@example.com' },
  include: { roles: true }
})

// Verificar que tiene rol 'student'
const isStudent = student?.roles.some(r => r.role === 'student')

if (!isStudent) {
  // Actualizar rol a 'student'
  await prisma.userRole.create({
    data: {
      userId: student.id,
      role: 'student'
    }
  })
}

// Obtener el coach
const coach = await prisma.coachProfile.findFirst({
  where: {
    user: {
      email: 'coach@example.com'
    }
  }
})

// Crear la relación
await prisma.coachStudentRelationship.create({
  data: {
    coachId: coach.id,
    studentId: student.id,
    status: 'active'
  }
})
```

## 📝 Ejemplo Completo: Endpoint para Crear Coach

```typescript
// app/api/coaches/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, businessName, phone, address } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Crear coach con perfil
    const coach = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name: name || email.split('@')[0],
        roles: {
          create: {
            role: 'coach'
          }
        },
        coachProfile: {
          create: {
            businessName: businessName || null,
            phone: phone || null,
            address: address || null,
            maxStudents: 20, // Valor por defecto
            commissionRate: 15.00 // Valor por defecto
          }
        }
      },
      include: {
        coachProfile: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Coach creado exitosamente',
      coach: {
        id: coach.id,
        email: coach.email,
        name: coach.name,
        coachProfile: coach.coachProfile
      }
    })
  } catch (error) {
    console.error('Error creating coach:', error)
    return NextResponse.json(
      { error: 'Error al crear el coach' },
      { status: 500 }
    )
  }
}
```

## 📝 Ejemplo Completo: Endpoint para Crear Student

```typescript
// app/api/students/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    // Crear estudiante
    const student = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name: name || email.split('@')[0],
        roles: {
          create: {
            role: 'student' // Rol específico de estudiante
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Estudiante creado exitosamente',
      student: {
        id: student.id,
        email: student.email,
        name: student.name
      }
    })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Error al crear el estudiante' },
      { status: 500 }
    )
  }
}
```

## 🔍 Verificar Rol de Usuario

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'usuario@example.com' },
  include: {
    roles: {
      orderBy: { createdAt: 'desc' },
      take: 1
    }
  }
})

const role = user?.roles[0]?.role // 'user' | 'student' | 'coach' | 'admin'
```

## ⚠️ Notas Importantes

1. **Un usuario puede tener múltiples roles**: El sistema permite múltiples registros en `user_roles_simple`, pero el login toma el más reciente.

2. **CoachProfile es opcional**: Un usuario con rol 'coach' puede no tener `CoachProfile` inicialmente, pero necesitará uno para funcionar como coach.

3. **Student no necesita perfil especial**: Un estudiante solo necesita el rol 'student' en `user_roles_simple`.

4. **Login funciona igual para todos**: El login en `lib/auth.ts` obtiene el rol del usuario automáticamente, sin importar si es user, student, coach o admin.



