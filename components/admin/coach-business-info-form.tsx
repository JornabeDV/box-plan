"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCoachProfile } from "@/hooks/use-coach-profile";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Phone,
  MapPin,
  Edit2,
  Loader2,
  Check,
  X,
} from "lucide-react";

export function CoachBusinessInfoForm() {
  const { profile, loading, updateProfile, fetchProfile } = useCoachProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    address: "",
  });

  // Cargar datos del perfil en el formulario cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateProfile({
      businessName: formData.businessName,
      phone: formData.phone,
      address: formData.address,
    });

    if (result.success) {
      toast({
        title: "Datos actualizados",
        description:
          "La información de tu negocio se ha guardado correctamente.",
      });
      setIsEditing(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    // Revertir cambios
    if (profile) {
      setFormData({
        businessName: profile.businessName || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
    setIsEditing(false);
  };

  if (loading && !profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Datos del Negocio
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Esta información será visible para tus estudiantes
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del Box / Negocio</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Ej: CrossFit Centro"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono de contacto
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Ej: +54 9 11 1234-5678"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Será visible para tus estudiantes para contacto o soporte por
                WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Ej: Av. Siempre Viva 123, Buenos Aires"
                maxLength={200}
              />
            </div>

            <div className="flex max-sm:flex-col items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 max-sm:w-full"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 max-sm:w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nombre del Box
                </p>
                <p className="font-medium">
                  {profile?.businessName || (
                    <span className="text-muted-foreground italic">
                      No especificado
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </p>
                <p className="font-medium">
                  {profile?.phone || (
                    <span className="text-muted-foreground italic">
                      No especificado
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dirección
              </p>
              <p className="font-medium">
                {profile?.address || (
                  <span className="text-muted-foreground italic">
                    No especificada
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
