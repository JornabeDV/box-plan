# Dashboard de Super Admin

Este documento describe el dashboard de superadmin para administrar coaches y sus planes.

## Estructura

### Rutas

- **`/superadmin`** - Dashboard principal del superadmin

### APIs Creadas

1. **`GET /api/superadmin/coaches`**
   - Lista todos los coaches con sus planes, suscripciones y estadísticas
   - Filtros disponibles:
     - `search`: Buscar por email, nombre o negocio
     - `plan`: Filtrar por plan (start, power, elite, no_plan)
     - `status`: Filtrar por estado (active, trial, expired, inactive)
   - Retorna:
     - Lista de coaches con información completa
     - Estadísticas generales

2. **`PATCH /api/superadmin/coaches/[coachId]/plan`**
   - Cambia el plan de un coach
   - Parámetros:
     - `planId`: ID del nuevo plan
     - `startDate`: Fecha de inicio (opcional)
     - `endDate`: Fecha de fin (opcional)
   - Acciones:
     - Cancela suscripciones activas anteriores
     - Crea nueva suscripción con el plan seleccionado
     - Actualiza `maxStudents` del coach según el plan

### Componentes

1. **`SuperAdminPage`** (`app/superadmin/page.tsx`)
   - Página principal del dashboard
   - Tabs: Resumen y Coaches
   - Filtros de búsqueda y estado
   - Solo accesible para usuarios con rol `admin`

2. **`SuperAdminStats`** (`components/superadmin/super-admin-stats.tsx`)
   - Muestra estadísticas generales:
     - Total de coaches
     - Coaches activos
     - En período de prueba
     - Total de estudiantes
     - Ganancias totales
     - Coaches expirados
     - Distribución de planes

3. **`CoachesList`** (`components/superadmin/coaches-list.tsx`)
   - Lista todos los coaches con:
     - Información básica (email, nombre, negocio)
     - Estado de acceso (activo, prueba, expirado)
     - Plan actual
     - Número de estudiantes
     - Fechas de suscripción
     - Ganancias
     - Estado de MercadoPago
   - Botón para cambiar plan

4. **`ChangePlanModal`** (`components/superadmin/change-plan-modal.tsx`)
   - Modal para cambiar el plan de un coach
   - Permite seleccionar:
     - Nuevo plan
     - Fecha de inicio
     - Fecha de fin

## Características

### Seguridad

- Solo usuarios con rol `admin` pueden acceder
- Validación en backend de permisos
- Protección de rutas

### Funcionalidades

1. **Visualización de Coaches**
   - Lista completa con información detallada
   - Filtros por plan y estado
   - Búsqueda por email, nombre o negocio

2. **Gestión de Planes**
   - Cambiar plan de cualquier coach
   - Establecer fechas de suscripción
   - Actualización automática de límites

3. **Estadísticas**
   - Métricas generales del sistema
   - Distribución de planes
   - Ganancias totales

## Uso

### Acceder al Dashboard

1. Asegúrate de tener rol `admin` en la base de datos
2. Navega a `/superadmin`
3. Verás el dashboard con todas las opciones

### Cambiar Plan de un Coach

1. Ve a la pestaña "Coaches"
2. Busca el coach que quieres modificar
3. Haz clic en "Cambiar Plan"
4. Selecciona el nuevo plan y fechas
5. Confirma el cambio

### Filtrar Coaches

- Usa la barra de búsqueda para buscar por email, nombre o negocio
- Usa el filtro de plan para ver solo coaches con un plan específico
- Usa el filtro de estado para ver coaches activos, en prueba, etc.

## Datos Mostrados

### Por Coach

- **Información Básica**: Email, nombre, negocio, teléfono
- **Estado**: Activo, en prueba, expirado, inactivo
- **Plan**: Plan actual con badge de color
- **Estudiantes**: Número actual vs máximo permitido
- **Suscripción**: Fechas de inicio y fin
- **Ganancias**: Total de comisiones recibidas
- **MercadoPago**: Estado de conexión

### Estadísticas Generales

- Total de coaches registrados
- Coaches con suscripción activa
- Coaches en período de prueba
- Total de estudiantes en el sistema
- Ganancias totales de todos los coaches
- Distribución de planes (Start, Power, Elite, Sin plan)

## Notas Importantes

1. **Permisos**: Solo usuarios con rol `admin` pueden acceder
2. **Cambios de Plan**: Al cambiar un plan, se cancela la suscripción anterior y se crea una nueva
3. **Límites**: El `maxStudents` del coach se actualiza automáticamente según el plan
4. **Fechas**: Si no se especifican fechas, se usa la fecha actual como inicio y un mes después como fin

## Próximas Mejoras Sugeridas

1. Exportar datos a CSV/Excel
2. Historial de cambios de planes
3. Notificaciones por email al cambiar plan
4. Gráficos de crecimiento y tendencias
5. Filtros avanzados adicionales
6. Acciones masivas (cambiar plan a múltiples coaches)

