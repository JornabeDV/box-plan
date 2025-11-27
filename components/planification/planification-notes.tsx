"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface PlanificationNotesProps {
  notes: string;
}

export function PlanificationNotes({ notes }: PlanificationNotesProps) {
  if (!notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-white">
          <FileText className="w-6 h-6 text-lime-400" />
          Notas Adicionales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base text-zinc-100 whitespace-pre-wrap leading-relaxed">
          {notes}
        </p>
      </CardContent>
    </Card>
  );
}
