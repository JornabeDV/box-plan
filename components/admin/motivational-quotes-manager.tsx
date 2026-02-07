"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface MotivationalQuote {
  id: number;
  quote: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MotivationalQuotesManagerProps {
  coachId: string | null;
  hasFeature: boolean;
}

export function MotivationalQuotesManager({
  coachId,
  hasFeature,
}: MotivationalQuotesManagerProps) {
  const [quotes, setQuotes] = useState<MotivationalQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MotivationalQuote | null>(
    null
  );
  const [quoteToDelete, setQuoteToDelete] = useState<MotivationalQuote | null>(
    null
  );
  const [formData, setFormData] = useState({
    quote: "",
    orderIndex: 0,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Cargar frases
  const loadQuotes = async () => {
    if (!coachId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/coaches/motivational-quotes");

      if (!response.ok) {
        throw new Error("Error al cargar frases");
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast({
        title: "Error",
        description: "Error al cargar las frases motivacionales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coachId && hasFeature) {
      loadQuotes();
    }
  }, [coachId, hasFeature]);

  const handleCreate = () => {
    setSelectedQuote(null);
    setFormData({
      quote: "",
      orderIndex: quotes.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (quote: MotivationalQuote) => {
    setSelectedQuote(quote);
    setFormData({
      quote: quote.quote,
      orderIndex: quote.orderIndex,
      isActive: quote.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (quote: MotivationalQuote) => {
    setQuoteToDelete(quote);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.quote.trim()) {
      toast({
        title: "Error",
        description: "La frase no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const url = selectedQuote
        ? `/api/coaches/motivational-quotes/${selectedQuote.id}`
        : "/api/coaches/motivational-quotes";
      const method = selectedQuote ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: selectedQuote
          ? "Frase actualizada correctamente"
          : "Frase creada correctamente",
      });

      setIsModalOpen(false);
      loadQuotes();
    } catch (error) {
      console.error("Error saving quote:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar la frase",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;

    try {
      const response = await fetch(
        `/api/coaches/motivational-quotes/${quoteToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Frase eliminada correctamente",
      });

      setIsDeleteDialogOpen(false);
      setQuoteToDelete(null);
      loadQuotes();
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la frase",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (quote: MotivationalQuote) => {
    try {
      const response = await fetch(
        `/api/coaches/motivational-quotes/${quote.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !quote.isActive,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar");
      }

      loadQuotes();
    } catch (error) {
      console.error("Error toggling quote:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la frase",
        variant: "destructive",
      });
    }
  };

  if (!hasFeature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Frases Motivacionales Personalizadas
          </CardTitle>
          <CardDescription className="text-foreground/70">
            Esta funcionalidad no está disponible en tu plan actual. Actualiza
            tu plan para personalizar las frases motivacionales que verán tus
            estudiantes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex flex-col gap-3">
              <CardTitle className="flex items-center gap-2 leading-tight">
                <MessageSquare className="h-5 w-5" />
                Frases Motivacionales Personalizadas
              </CardTitle>
              <CardDescription className="text-foreground/70">
                Gestiona las frases motivacionales que verán tus estudiantes en
                su dashboard. Puedes crear hasta 10 frases.
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={handleCreate}
                disabled={quotes.length >= 10}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Frase
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                No has creado ninguna frase motivacional aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={quote.isActive ? "default" : "secondary"}>
                        {quote.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Orden: {quote.orderIndex}
                      </span>
                    </div>
                    <p className="text-sm break-words">{quote.quote}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={quote.isActive}
                      onCheckedChange={() => handleToggleActive(quote)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quote)}
                      className="flex-shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(quote)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {quotes.length >= 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Has alcanzado el límite de 10 frases
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedQuote ? "Editar Frase" : "Nueva Frase Motivacional"}
            </DialogTitle>
            <DialogDescription>
              Escribe una frase motivacional que inspire a tus estudiantes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quote">Frase</Label>
              <Textarea
                id="quote"
                value={formData.quote}
                onChange={(e) =>
                  setFormData({ ...formData, quote: e.target.value })
                }
                placeholder="Ej: El único entrenamiento malo es el que no haces. ¡Vamos!"
                className="text-sm placeholder:text-sm border border-border bg-input"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.quote.length}/500 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Orden</Label>
              <Input
                id="orderIndex"
                type="number"
                min="0"
                value={formData.orderIndex}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    orderIndex: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Las frases se mostrarán en este orden (menor número primero)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Activa</Label>
            </div>
          </div>
          <DialogFooter className="max-sm:flex-col">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
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

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Frase"
        description={`¿Estás seguro de que quieres eliminar esta frase? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}
