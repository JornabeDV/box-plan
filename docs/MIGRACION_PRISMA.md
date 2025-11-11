# Migración a Prisma

## 📋 Resumen

Este documento explica la migración de SQL directo (Neon) a Prisma ORM para mejorar el type safety y la experiencia de desarrollo.

## 🎯 Ventajas de Prisma

1. **Type Safety**: Tipos generados automáticamente desde el schema
2. **Migraciones Automáticas**: Prisma maneja las migraciones por ti
3. **Mejor DX**: Queries más limpias y legibles
4. **IntelliSense**: Autocompletado completo en el IDE
5. **Validación**: Validación automática de datos

## 📦 Instalación

### 1. Instalar dependencias

```bash
pnpm install @prisma/client prisma
```

### 2. Generar el cliente de Prisma

```bash
pnpm db:generate
```

### 3. Sincronizar el schema con la base de datos

```bash
# Opción A: Push directo (desarrollo)
pnpm db:push

# Opción B: Crear migración (producción)
pnpm db:migrate
```

## 🗄️ Schema Prisma

El archivo `prisma/schema.prisma` contiene todas las definiciones de tablas:

- ✅ Todas las tablas con SERIAL (INTEGER)
- ✅ Sin foreign keys (como solicitaste)
- ✅ Relaciones definidas pero sin constraints en DB
- ✅ Tipos TypeScript generados automáticamente

## 🔄 Migración Gradual

### Estrategia Recomendada

1. **Fase 1**: Mantener ambos (Neon y Prisma) durante la transición
2. **Fase 2**: Migrar archivos críticos primero:
   - `app/api/auth/register/route.ts`
   - `app/api/auth/[...nextauth]/route.ts`
   - `lib/auth.ts`
3. **Fase 3**: Migrar resto de APIs gradualmente
4. **Fase 4**: Eliminar dependencia de Neon cuando todo esté migrado

## 📝 Ejemplos de Migración

### Antes (Neon SQL)

```typescript
const result = await sql`
  INSERT INTO users (email, password, name)
  VALUES (${email}, ${hashedPassword}, ${name})
  RETURNING id
`
const userId = result[0].id
```

### Después (Prisma)

```typescript
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    name
  }
})
const userId = user.id
```

### Consultas

**Antes:**
```typescript
const users = await sql`
  SELECT * FROM users WHERE email = ${email}
`
```

**Después:**
```typescript
const user = await prisma.user.findUnique({
  where: { email }
})
```

## 🚀 Comandos Útiles

```bash
# Generar cliente después de cambiar schema
pnpm db:generate

# Sincronizar schema con DB (sin crear migración)
pnpm db:push

# Crear migración
pnpm db:migrate

# Abrir Prisma Studio (GUI para ver datos)
pnpm db:studio
```

## ⚠️ Notas Importantes

1. **Sin Foreign Keys**: El schema define relaciones pero NO crea foreign keys en la DB (como solicitaste)
2. **Compatibilidad**: Puedes usar Prisma y Neon SQL al mismo tiempo durante la migración
3. **Type Safety**: Los tipos se generan automáticamente desde el schema
4. **Migraciones**: Prisma puede crear migraciones automáticamente o puedes usar `db:push` para desarrollo

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Next.js Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)


