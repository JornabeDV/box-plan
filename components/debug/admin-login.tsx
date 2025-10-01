'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Redirigir al dashboard de admin
        router.push('/admin-dashboard')
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  const handleQuickAdminLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // Intentar login con el usuario admin existente
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jorgebejarosa@gmail.com',
        password: 'admin123' // Cambiar por la contraseña real
      })

      if (error) {
        setError('Error: ' + error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        router.push('/admin-dashboard')
      }
    } catch (err) {
      setError('Error inesperado')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Login de Administrador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm text-muted-foreground">
          O
        </div>
        
        <Button 
          onClick={handleQuickAdminLogin}
          variant="outline" 
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando...
            </>
          ) : (
            'Login Rápido (Admin)'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
