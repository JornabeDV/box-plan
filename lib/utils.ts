import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza una fecha para evitar problemas de zona horaria
 * Convierte una fecha en formato string (YYYY-MM-DD) a un objeto Date
 * asegurándose de que se guarde correctamente en la base de datos sin desplazamiento
 * 
 * Para campos @db.Date en PostgreSQL, necesitamos crear la fecha de manera
 * que cuando Prisma la envíe a la base de datos, se guarde como la fecha correcta.
 * 
 * El problema: 
 * - Argentina está en UTC-3
 * - Si en Argentina son las 22:00 del día 17, en UTC son las 01:00 del día 18
 * - Si el servidor está en UTC y recibe "2025-11-17", puede interpretarlo incorrectamente
 * 
 * Solución: Crear la fecha representando el inicio del día en Argentina (UTC-3).
 * Si queremos guardar el día 17, creamos la fecha como "2025-11-17T03:00:00Z"
 * (que es 00:00 del día 17 en Argentina, o 03:00 UTC del día 17).
 * Esto asegura que cuando PostgreSQL trunque a solo fecha, se guarde como día 17.
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD (fecha local en Argentina)
 * @returns Date normalizada que representa el inicio del día en Argentina (UTC-3)
 */
export function normalizeDateForArgentina(dateString: string): Date {
  // Parsear la fecha manualmente
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Crear la fecha representando el inicio del día en Argentina (UTC-3)
  // Las 00:00 en Argentina (UTC-3) = 03:00 UTC del mismo día
  // Esto asegura que cuando se guarde en PostgreSQL, se guarde como la fecha correcta
  // incluso si el servidor está en UTC y ya es el día siguiente
  const date = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
  
  return date
}
