"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentOption {
  id: string;
  name: string | null;
  email: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  planificationId?: number;
  date?: string;
  discipline?: string;
  level?: string;
  type?: string;
  student?: string;
  blocksCount?: number;
  exercisesCount?: number;
  action?: "created" | "updated" | "skipped";
  error?: string;
}

interface ImportSummary {
  total: number;
  success: number;
  failed: number;
  created: number;
  updated: number;
}

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  students?: StudentOption[];
  preselectedStudent?: StudentOption | null;
}

type ModalState = "idle" | "loading" | "results";

export function BulkImportModal({
  open,
  onOpenChange,
  onSuccess,
  students = [],
  preselectedStudent = null,
}: BulkImportModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [assignToStudent, setAssignToStudent] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setModalState("idle");
      setResults([]);
      setSummary(null);
      setSelectedStudentId("");
      setAssignToStudent(false);
    }, 200);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const response = await fetch("/api/planifications/template");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al descargar la plantilla");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_planificaciones_boxplan.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Plantilla descargada",
        description: "El archivo de ejemplo se ha descargado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar la plantilla",
        variant: "destructive",
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setModalState("loading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const targetStudentId = preselectedStudent
        ? preselectedStudent.id
        : selectedStudentId;
      if (targetStudentId) {
        formData.append("targetStudentId", targetStudentId);
      }

      const response = await fetch("/api/planifications/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al importar las planificaciones");
      }

      setResults(data.results || []);
      setSummary(data.summary || null);
      setModalState("results");

      const hasSuccess = (data.results || []).some(
        (r: ImportResult) => r.success,
      );
      if (hasSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error al importar",
        description:
          error.message ||
          "No se pudieron importar las planificaciones. Verifica el formato del archivo.",
        variant: "destructive",
      });
      setModalState("idle");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const hasPersonalizedStudents = students.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader className="pr-0 h-auto">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar múltiples días
          </DialogTitle>
          <DialogDescription className="text-left">
            {modalState === "idle" &&
              "Subí un archivo Excel con planificaciones de varios días."}
            {modalState === "loading" &&
              "Procesando tu archivo, aguardá un momento..."}
            {modalState === "results" &&
              `Resultado de la importación: ${summary?.success} de ${summary?.total} planificaciones procesadas correctamente.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {modalState === "idle" && (
            <div className="space-y-6">
              {/* Selector de estudiante (solo si hay estudiantes con plan personalizado) */}
              {hasPersonalizedStudents && (
                <div className="space-y-3">
                  {preselectedStudent ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">
                        {preselectedStudent.name || preselectedStudent.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (preseleccionado)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="import-mode"
                          checked={!assignToStudent}
                          onChange={() => {
                            setAssignToStudent(false);
                            setSelectedStudentId("");
                          }}
                          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                        />
                        <span className="text-sm">General</span>
                      </label>
                      <label className="flex flex-col items-start gap-3 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="import-mode"
                            checked={assignToStudent}
                            onChange={() => setAssignToStudent(true)}
                            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                          />
                          <div className="flex-1 space-y-2">
                            <span className="text-sm">
                              Personalizada para un atleta
                            </span>
                          </div>
                        </div>

                        {assignToStudent && (
                          <Select
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar atleta..." />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  <span className="truncate block max-w-[280px]">
                                    {student.name || student.email}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {preselectedStudent ||
                    (assignToStudent && selectedStudentId)
                      ? "Las planificaciones con Tipo = Personalizada se asignarán a este atleta. Ignora la columna Estudiante del Excel."
                      : "El archivo debe tener la columna Estudiante si querés planificaciones personalizadas, o dejá el Tipo como General."}
                  </p>
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Como funciona
                </h4>
                <p className="text-sm text-muted-foreground">
                  Subí un solo archivo Excel con las planificaciones de varios
                  días. El sistema detecta automáticamente cada fecha y crea una
                  planificación independiente por día.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    Columna <strong>Fecha</strong> en formato YYYY-MM-DD
                  </li>
                  <li>
                    Repetí la misma fecha para todas las filas de un mismo día
                  </li>
                  <li>Cambiá la fecha para el siguiente día</li>
                  <li>
                    Las columnas obligatorias son: Fecha, Disciplina, Nivel,
                    Tipo, Bloque
                  </li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 text-base whitespace-normal"
                >
                  <Upload className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate text-sm md:text-base">
                    Seleccionar archivo Excel
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="w-full h-11 whitespace-normal"
                >
                  {downloadingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                      <span className="truncate">Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 shrink-0" />
                      <span className="truncate  text-sm md:text-base">
                        Descargar plantilla
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* Nota */}
              <p className="text-xs text-muted-foreground text-center">
                Si importás un día que ya existe, se sobrescribirá
                completamente.
              </p>
            </div>
          )}

          {modalState === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analizando y procesando planificaciones...
              </p>
            </div>
          )}

          {modalState === "results" && (
            <div className="space-y-4">
              {/* Resumen */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-lg font-bold">{summary.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {summary.success}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Exitosas
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {summary.created}
                    </div>
                    <div className="text-xs text-muted-foreground">Creadas</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {summary.updated}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Actualizadas
                    </div>
                  </div>
                </div>
              )}

              {/* Lista detallada */}
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 flex items-start gap-3 ${
                      result.success
                        ? "bg-green-50/50 dark:bg-green-950/10"
                        : "bg-red-50/50 dark:bg-red-950/10"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {formatDate(result.date)}
                        </span>
                        {result.discipline && result.level && (
                          <span className="text-xs text-muted-foreground">
                            {result.discipline} · {result.level}
                          </span>
                        )}
                        {result.type === "Personalizada" && result.student && (
                          <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
                            {result.student}
                          </span>
                        )}
                        {result.action && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              result.action === "created"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}
                          >
                            {result.action === "created"
                              ? "Creada"
                              : "Actualizada"}
                          </span>
                        )}
                      </div>
                      {result.success ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.blocksCount} bloque
                          {result.blocksCount !== 1 ? "s" : ""} ·{" "}
                          {result.exercisesCount} ejercicio
                          {result.exercisesCount !== 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          {result.error || result.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {modalState === "results" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setModalState("idle");
                setResults([]);
                setSummary(null);
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar otro archivo
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
