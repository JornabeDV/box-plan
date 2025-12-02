"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";

export function CoachLogoUpload() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Cargar logo actual al montar el componente
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setFetching(true);
        const response = await fetch("/api/coaches/logo");
        if (response.ok) {
          const data = await response.json();
          setLogoUrl(data.logoUrl);
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchLogo();
  }, []);

  const handleLogoClick = () => {
    if (!uploading && !removing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    // Subir automáticamente
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/coaches/logo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir logo");
      }

      const data = await response.json();
      setLogoUrl(data.logoUrl);

      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Logo subido",
        description: "El logo se ha actualizado correctamente",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al subir logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      const response = await fetch("/api/coaches/logo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logoUrl: null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar logo");
      }

      setLogoUrl(null);

      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Logo eliminado",
        description: "El logo se ha eliminado correctamente",
      });
    } catch (error) {
      console.error("Error removing logo:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar logo",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  if (fetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo del Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Logo del Coach
        </CardTitle>
        <CardDescription>
          Personaliza tu marca agregando el logo de tu box o gimnasio. Este logo
          se mostrará a tus estudiantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input oculto para seleccionar archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || removing}
        />

        {/* Logo clickeable */}
        <div className="flex flex-col items-center gap-4">
          {logoUrl ? (
            <div className="relative group">
              <div
                onClick={handleLogoClick}
                className="relative w-48 h-48 md:w-64 md:h-64 border-2 border-border rounded-lg overflow-hidden bg-background cursor-pointer hover:border-lime-400/50 transition-all duration-300 hover:shadow-lg"
              >
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center z-10">
                    <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                <Image
                  src={logoUrl}
                  alt="Logo del coach"
                  fill
                  className="object-contain p-4"
                  onError={() => {
                    toast({
                      title: "Error al cargar imagen",
                      description: "La imagen no está disponible",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Haz clic en el logo para cambiarlo
              </p>
            </div>
          ) : (
            <div
              onClick={handleLogoClick}
              className="relative w-48 h-48 md:w-64 md:h-64 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/50 cursor-pointer hover:border-lime-400/50 hover:bg-muted transition-all duration-300 flex flex-col items-center justify-center gap-4"
            >
              {uploading ? (
                <Loader2 className="w-12 h-12 animate-spin text-lime-400" />
              ) : (
                <>
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-foreground">
                      Haz clic para subir tu logo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF, WebP • Máx. 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Botón para eliminar logo */}
          {logoUrl && (
            <Button
              onClick={handleRemove}
              disabled={uploading || removing}
              variant="destructive"
              size="sm"
            >
              {removing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Eliminar Logo
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
