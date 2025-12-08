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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Link2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MercadoPagoConnectProps {
  coachId?: number;
}

export function MercadoPagoConnect({ coachId }: MercadoPagoConnectProps) {
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualAccountId, setManualAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
      // Usar URL absoluta para asegurar que use el dominio correcto
      // El endpoint detectará automáticamente la URL desde la request
      const connectUrl = `${window.location.origin}/api/mercadopago/connect`;
      console.log("Conectando a:", connectUrl);

      // Redirigir a endpoint que inicia OAuth
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

  const handleManualSave = async () => {
    if (!manualAccountId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un Account ID válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/coaches/mercadopago-account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId: manualAccountId.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Account ID guardado",
        description:
          "Tu Account ID de MercadoPago se ha guardado correctamente",
      });

      setIsManualDialogOpen(false);
      setManualAccountId("");
      loadConnectionStatus();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al guardar Account ID",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Conexión con MercadoPago
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de MercadoPago para recibir pagos automáticamente
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
                Los pagos de tus estudiantes se distribuirán automáticamente
                entre tu cuenta y la plataforma.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setManualAccountId(accountId || "");
                  setIsManualDialogOpen(true);
                }}
              >
                Actualizar Account ID
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span>Cuenta no conectada</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para recibir pagos automáticamente, necesitas conectar tu cuenta
                de MercadoPago. Puedes hacerlo de dos formas:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleConnectOAuth}
                  disabled={isConnecting}
                  className="flex-1"
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
                <Button
                  variant="outline"
                  onClick={() => setIsManualDialogOpen(true)}
                  className="flex-1"
                >
                  Ingresar Manualmente
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">
                  ¿Dónde encuentro mi Account ID?
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Inicia sesión en tu cuenta de MercadoPago</li>
                  <li>Ve a Configuración → Integraciones</li>
                  <li>Tu Account ID aparece en la sección de credenciales</li>
                  <li>O puedes encontrarlo en la URL de tu perfil</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ingreso manual */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar Account ID Manualmente</DialogTitle>
            <DialogDescription>
              Ingresa tu Account ID de MercadoPago. Lo puedes encontrar en tu
              panel de MercadoPago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={manualAccountId}
                onChange={(e) => setManualAccountId(e.target.value)}
                placeholder="123456789"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa solo números. Puedes encontrarlo en tu cuenta de
                MercadoPago.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManualDialogOpen(false);
                setManualAccountId("");
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleManualSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
