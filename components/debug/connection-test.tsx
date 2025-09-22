"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function ConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    connection: boolean
    error?: string
  } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResults(null)

    try {
      // Test 1: Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const envResults = {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        connection: false,
        error: undefined as string | undefined
      }

      if (!supabaseUrl || !supabaseKey) {
        envResults.error = 'Variables de entorno de Supabase no configuradas'
        setResults(envResults)
        setTesting(false)
        return
      }

      // Test 2: Test actual connection
      try {
        const { data, error } = await supabase
          .from('user_roles_simple')
          .select('count')
          .limit(1)

        if (error) {
          envResults.error = `Error de conexión: ${error.message}`
        } else {
          envResults.connection = true
        }
      } catch (err) {
        envResults.error = `Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`
      }

      setResults(envResults)
    } catch (err) {
      setResults({
        supabaseUrl: false,
        supabaseKey: false,
        connection: false,
        error: `Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Diagnóstico de Conexión</CardTitle>
        <CardDescription>
          Verifica la configuración de Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Probar Conexión
        </Button>

        {results && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {results.supabaseUrl ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                URL de Supabase: {results.supabaseUrl ? 'Configurada' : 'Faltante'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {results.supabaseKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Clave de Supabase: {results.supabaseKey ? 'Configurada' : 'Faltante'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {results.connection ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                Conexión: {results.connection ? 'Exitosa' : 'Fallida'}
              </span>
            </div>

            {results.error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  {results.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
