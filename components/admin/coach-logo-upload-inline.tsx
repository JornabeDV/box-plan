"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function CoachLogoUploadInline() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    event: React.ChangeEvent<HTMLInputElement>,
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

  const handleRemoveClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
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
      setShowDeleteDialog(false);

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
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
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
      {logoUrl ? (
        <div
          onClick={handleLogoClick}
          className="relative w-24 h-24 flex-shrink-0 border-2 border-border rounded-lg overflow-hidden bg-background cursor-pointer hover:border-lime-400/50 transition-all duration-300 hover:shadow-md"
        >
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center z-10">
            <Upload className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
          <Image
            src={logoUrl}
            alt="Logo del coach"
            fill
            className="object-cover"
            onError={() => {
              toast({
                title: "Error al cargar imagen",
                description: "La imagen no está disponible",
                variant: "destructive",
              });
            }}
          />
        </div>
      ) : (
        <div
          onClick={handleLogoClick}
          className="relative w-24 h-24 flex-shrink-0 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/50 cursor-pointer hover:border-lime-400/50 hover:bg-muted transition-all duration-300 flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center px-2">
                Haz clic para subir
              </p>
            </>
          )}
        </div>
      )}

      {/* Información y controles */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-start gap-1 min-w-0">
            <span className="text-sm font-medium">Logo</span>
            {logoUrl && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Haz clic para cambiar
              </span>
            )}
          </div>
          {logoUrl && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveClick();
              }}
              disabled={uploading || removing}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Máximo 5MB • JPG, PNG, GIF, WebP
        </span>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!removing) {
            setShowDeleteDialog(open);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Logo"
        description="¿Estás seguro de que quieres eliminar el logo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={removing}
      />
    </div>
  );
}
