'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, DollarSign, Calendar, UserPlus, AlertCircle } from 'lucide-react'

interface User {
  id: string
  has_subscription: boolean
  subscription?: {
    current_period_end: string
    plan: {
      price: number
      currency: string
    }
  } | null
  created_at: string
}

interface Planification {
  date: string | Date
}

interface AdminStatsProps {
  users: User[]
  planifications: Planification[]
}

export function AdminStats({ users, planifications }: AdminStatsProps) {
  // Calcular métricas
  const totalUsers = users.length
  const activeSubscriptions = users.filter(u => u.has_subscription).length
  
  // MRR: Sumar precios de todas las suscripciones activas
  const mrr = users
    .filter(u => u.has_subscription && u.subscription?.plan)
    .reduce((sum, u) => {
      const price = u.subscription?.plan?.price || 0
      return sum + price
    }, 0)
  
  // Planificaciones del mes actual
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const planificationsThisMonth = planifications.filter(p => {
    if (!p.date) return false
    const planDate = p.date instanceof Date ? p.date : new Date(p.date)
    return planDate.getMonth() === currentMonth && planDate.getFullYear() === currentYear
  }).length
  
  // Nuevos estudiantes este mes
  const newStudentsThisMonth = users.filter(u => {
    const createdDate = new Date(u.created_at)
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
  }).length
  
  // Suscripciones que vencen pronto (próximos 7 días)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const expiringSoon = users.filter(u => {
    if (!u.has_subscription || !u.subscription?.current_period_end) return false
    const endDate = new Date(u.subscription.current_period_end)
    const now = new Date()
    return endDate >= now && endDate <= sevenDaysFromNow
  }).length

  // Formatear moneda
  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Estudiantes con suscripción activa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            de {totalUsers} estudiantes
          </p>
        </CardContent>
      </Card>

      {/* Ingresos mensuales recurrentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
          <p className="text-xs text-muted-foreground">
            Recurrentes (MRR)
          </p>
        </CardContent>
      </Card>

      {/* Planificaciones del mes actual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Planificaciones del Mes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{planificationsThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Este mes
          </p>
        </CardContent>
      </Card>

      {/* Nuevos estudiantes este mes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nuevos Estudiantes</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newStudentsThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            Este mes
          </p>
        </CardContent>
      </Card>

      {/* Suscripciones que vencen pronto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencen Pronto</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringSoon}</div>
          <p className="text-xs text-muted-foreground">
            Próximos 7 días
          </p>
        </CardContent>
      </Card>

      {/* Total de estudiantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Registrados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}