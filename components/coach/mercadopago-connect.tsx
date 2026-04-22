"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Link2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface MercadoPagoConnectProps {
  coachId?: number;
}

export function MercadoPagoConnect({ coachId }: MercadoPagoConnectProps) {
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Cargar estado de conexión
  useEffect(() => {
    loadConnectionStatus();
  }, []);

  // Verificar si hay parámetros de éxito/error en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mercadopago_connected") === "true") {
      toast({
        title: "Cuenta conectada",
        description: "Tu cuenta de MercadoPago se ha conectado exitosamente",
      });
      loadConnectionStatus();
      // Limpiar URL (mantener tab si existe)
      const tab = params.get("tab");
      const newUrl = tab
        ? `${window.location.pathname}?tab=${tab}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
    if (params.get("mercadopago_error")) {
      const error = params.get("mercadopago_error");
      toast({
        title: "Error al conectar",
        description: getErrorMessage(error || "unknown_error"),
        variant: "destructive",
      });
      // Limpiar URL (mantener tab si existe)
      const tab = params.get("tab");
      const newUrl = tab
        ? `${window.location.pathname}?tab=${tab}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coaches/mercadopago-account");
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        setAccountId(data.accountId);
      }
    } catch (error) {
      console.error("Error cargando estado de conexión:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuth = async () => {
    try {
      setIsConnecting(true);
      const connectUrl = `${window.location.origin}/api/mercadopago/connect`;
      window.location.href = connectUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al iniciar conexión con MercadoPago",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    const errors: Record<string, string> = {
      missing_params: "Faltan parámetros en la respuesta de MercadoPago",
      invalid_state: "Sesión inválida. Por favor intenta nuevamente",
      unauthorized: "No autorizado. Por favor inicia sesión nuevamente",
      config_error: "Error de configuración del servidor",
      token_error: "Error al obtener token de autorización",
      user_info_error: "Error al obtener información de tu cuenta",
      no_account_id: "No se pudo obtener el Account ID de tu cuenta",
      platform_account_id_mismatch:
        "No puedes conectar la cuenta de la plataforma como coach. Usá otra cuenta de MercadoPago.",
      unknown_error: "Error desconocido al conectar con MercadoPago",
    };
    return errors[error] || "Error al conectar con MercadoPago";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conexión con MercadoPago</CardTitle>
          <CardDescription>Verificando estado de conexión...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Conexión con MercadoPago
        </CardTitle>
        <CardDescription>
          Conectá tu cuenta para que tus estudiantes puedan pagarte
          directamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Cuenta conectada</span>
            </div>
            {accountId && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">
                  Account ID:
                </Label>
                <p className="font-mono text-sm mt-1">{accountId}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Los pagos de tus estudiantes se acreditan directamente en tu
              cuenta de MercadoPago.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <span>Cuenta no conectada</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Para recibir pagos de tus estudiantes debés autorizar a Box Plan
              para operar en tu cuenta de MercadoPago. Hacé clic en el botón de
              abajo para conectarte de forma segura.
            </p>
            <Button
              onClick={handleConnectOAuth}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Conectar con MercadoPago
                </>
              )}
            </Button>
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Serás redirigido a MercadoPago para iniciar sesión
                </li>
                <li>Autorizás a Box Plan a crear cobros en tu nombre</li>
                <li>
                  Volvés automáticamente con tu cuenta lista para recibir pagos
                </li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
