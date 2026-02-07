"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Search,
  Edit,
  Trash2,
  Target,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Discipline } from "@/hooks/use-disciplines";

interface DisciplinesListProps {
  disciplines: Discipline[];
  loading?: boolean;
  onEdit: (discipline: Discipline) => void;
  onDelete: (discipline: Discipline) => void;
}

export function DisciplinesList({
  disciplines,
  loading = false,
  onEdit,
  onDelete,
}: DisciplinesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDisciplines, setExpandedDisciplines] = useState<Set<string>>(
    new Set(),
  );

  // Filtrar disciplinas según búsqueda
  const filteredDisciplines = disciplines.filter(
    (discipline) =>
      discipline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discipline.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      discipline.levels?.some((level) =>
        level.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const toggleDiscipline = (disciplineId: string) => {
    setExpandedDisciplines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(disciplineId)) {
        newSet.delete(disciplineId);
      } else {
        newSet.add(disciplineId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Cargando disciplinas...</p>
      </div>
    );
  }

  if (disciplines.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay disciplinas</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery
            ? "No se encontraron disciplinas con ese criterio."
            : "Crea tu primera disciplina."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar disciplinas o niveles..."
          value={searchQuery}
          className="pl-10 text-sm placeholder:text-sm"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Lista de disciplinas */}
      <div className="space-y-3">
        {filteredDisciplines.map((discipline) => (
          <Card
            key={discipline.id}
            className="hover:shadow-lg transition-shadow max-sm:py-3"
          >
            <CardHeader className="pb-0">
              {/* Header con título y color */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: discipline.color }}
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg break-words leading-tight">
                    {discipline.name}
                  </CardTitle>
                  {discipline.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {discipline.description}
                    </CardDescription>
                  )}
                </div>
              </div>

              {/* Footer con badges y botones */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {discipline.levels?.length || 0} niveles
                  </Badge>

                  {discipline.levels && discipline.levels.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDiscipline(discipline.id)}
                      className="h-8 px-2"
                    >
                      {expandedDisciplines.has(discipline.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                <TooltipProvider delayDuration={0}>
                  <div className="flex gap-2 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(discipline)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[100]">
                        <p>Editar disciplina</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(discipline)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[100]">
                        <p>Eliminar disciplina</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </CardHeader>

            {/* Niveles expandidos */}
            {expandedDisciplines.has(discipline.id) && discipline.levels && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Niveles:
                  </h4>
                  {discipline.levels.map((level, index) => (
                    <div
                      key={level.id}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{level.name}</div>
                        {level.description && (
                          <div className="text-sm text-muted-foreground">
                            {level.description}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
