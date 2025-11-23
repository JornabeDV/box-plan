# Configuración de Cron Jobs

## Revisión Diaria de Suscripciones Vencidas

Este cron job revisa diariamente las suscripciones que han vencido y actualiza su estado a `past_due`.

---

## Configuración con Cron-job.org

Sigue estos pasos para configurar el cron job en cron-job.org:

### Paso 1: Configurar Variables de Entorno

**IMPORTANTE**: Primero configura el secret para proteger el endpoint.

1. Agrega `CRON_SECRET` a tus variables de entorno (`.env` o en tu hosting):
   ```env
   CRON_SECRET=tu-secret-super-seguro-aqui-genera-uno-aleatorio
   ```

2. **Generar un secret seguro**: Puedes usar:
   ```bash
   # En Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # O usar cualquier generador de strings aleatorios
   ```

### Paso 2: Crear el Cron Job en cron-job.org

1. **Ir a**: https://cron-job.org/jobs/create
   - Si no tienes cuenta, créala gratis (es rápido)

2. **Configurar el Job**:
   - **Title**: `Revisar Suscripciones Vencidas BoxPlan`
   - **Address (URL)**: 
     ```
     https://tu-dominio.com/api/cron/check-expired-subscriptions
     ```
     ⚠️ Reemplaza `tu-dominio.com` con tu dominio real
   
   - **Schedule**: 
     - Selecciona `Daily` (diario)
     - O configura manualmente: `0 2 * * *` (2:00 AM UTC todos los días)
     - Recomendado: Ejecutar en horario de bajo tráfico (2-4 AM)
   
   - **Request Method**: `GET` (también acepta POST)
   
   - **Request Headers** (IMPORTANTE para seguridad):
     ```
     Authorization: Bearer tu-secret-super-seguro-aqui
     ```
     ⚠️ Usa el mismo valor que configuraste en `CRON_SECRET`
   
   - **Notifications**: (Opcional)
     - Activa notificaciones por email si el job falla
     - Útil para detectar problemas

3. **Guardar el Job**: Haz clic en "Create" o "Save"

### Paso 3: Verificar que Funciona

1. **Probar manualmente primero**:
   ```bash
   curl -H "Authorization: Bearer tu-secret" \
     https://tu-dominio.com/api/cron/check-expired-subscriptions
   ```
   
   Deberías recibir una respuesta JSON con `success: true`

2. **En cron-job.org**:
   - Ve a "My Cron Jobs"
   - Haz clic en "Execute now" para probar inmediatamente
   - Revisa los logs para ver si fue exitoso

3. **Verificar en la base de datos**:
   - Revisa que las suscripciones vencidas se actualizaron a `status = 'past_due'`

### Seguridad

- ✅ **SIEMPRE** configura `CRON_SECRET` antes de crear el cron job
- ✅ El endpoint rechazará peticiones sin el secret correcto (401 Unauthorized)
- ✅ No compartas el secret públicamente ni lo subas a Git
- ✅ Usa HTTPS en la URL del cron job

---

## Variables de Entorno Requeridas

```env
# REQUERIDO para seguridad (el endpoint rechazará peticiones sin esto)
CRON_SECRET=tu-secret-super-seguro-aqui-genera-uno-aleatorio
```

⚠️ **IMPORTANTE**: Este secret es OBLIGATORIO. Sin él, el endpoint rechazará todas las peticiones.

---

## Endpoint

**URL**: `/api/cron/check-expired-subscriptions`

**Método**: `GET` o `POST`

**Headers** (si `CRON_SECRET` está configurado):
```
Authorization: Bearer TU_CRON_SECRET
```

**Respuesta exitosa**:
```json
{
	"success": true,
	"expiredCount": 5,
	"updatedCount": 5,
	"expiredSubscriptions": [
		{
			"id": 123,
			"userId": 456,
			"userEmail": "usuario@example.com",
			"planName": "Plan Pro",
			"expiredAt": "2024-01-15T00:00:00.000Z"
		}
	]
}
```

---

## Qué hace el cron job

1. Busca todas las suscripciones con:
   - `status = 'active'`
   - `currentPeriodEnd < ahora`

2. Actualiza el `status` a `'past_due'` para todas las encontradas

3. Esto hace que:
   - `has_subscription` se vuelva `false` (porque depende de `status === 'active'`)
   - Los alumnos aparezcan como inactivos en el dashboard del coach

---

## Testing Manual

Puedes probar el endpoint manualmente:

```bash
# Con secret
curl -H "Authorization: Bearer tu-secret" \
  https://tu-dominio.com/api/cron/check-expired-subscriptions

# Sin secret (si no está configurado)
curl https://tu-dominio.com/api/cron/check-expired-subscriptions
```

---

## Troubleshooting

### El cron no se ejecuta

1. **cron-job.org**: 
   - Verifica que el job está activo (no pausado)
   - Revisa los logs en "Execution Log" de cron-job.org
   - Verifica que la URL es correcta y accesible

2. **Revisa los logs del servidor**:
   - Si estás en Vercel: Dashboard → Project → Logs
   - Si estás en otro hosting: Revisa los logs de la aplicación

### Error 401 Unauthorized

- ✅ Verifica que `CRON_SECRET` está configurado en las variables de entorno
- ✅ Verifica que el header `Authorization: Bearer ...` está configurado en cron-job.org
- ✅ Asegúrate de que el secret en el header coincide exactamente con `CRON_SECRET`
- ✅ Prueba manualmente con curl para verificar

### Error 500 Internal Server Error

- Revisa los logs del servidor para ver el error específico
- Verifica que la conexión a la base de datos funciona
- Verifica que Prisma está configurado correctamente

### No se actualizan las suscripciones

- Verifica que hay suscripciones con `currentPeriodEnd` en el pasado
- Verifica que esas suscripciones tienen `status = 'active'`
- Revisa los logs del endpoint para ver cuántas encontró y actualizó
- Prueba ejecutando el endpoint manualmente

### El cron se ejecuta pero no hace nada

- Verifica que hay suscripciones vencidas en la base de datos
- Revisa la respuesta del endpoint en los logs de cron-job.org
- Verifica que `expiredCount` y `updatedCount` en la respuesta son mayores a 0

---

## Próximos Pasos

Después de configurar el cron:

1. ✅ Implementar la sección de alumnos inactivos en el dashboard del coach
2. ✅ Agregar notificaciones cuando un plan está por vencer
3. ✅ Considerar enviar emails a usuarios con planes vencidos

