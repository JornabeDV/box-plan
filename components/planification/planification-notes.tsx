"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface PlanificationNotesProps {
  notes: string;
}

export function PlanificationNotes({ notes }: PlanificationNotesProps) {
  if (!notes) return null;

  return (
    <Card className="max-sm:py-2">
      <CardHeader className="max-sm:px-4 max-sm:py-0">
        <CardTitle className="text-xl max-sm:text-base flex items-center gap-2 text-white">
          <FileText className="w-6 h-6 max-sm:w-4 max-sm:h-4 text-primary" />
          Notas Adicionales
        </CardTitle>
      </CardHeader>
      <CardContent className="max-sm:px-4 max-sm:pt-0">
        <p className="text-base max-sm:text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
          {notes}
        </p>
      </CardContent>
    </Card>
  );
}
