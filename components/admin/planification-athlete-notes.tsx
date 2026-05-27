"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AthleteNote {
  id: string;
  note: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface PlanificationAthleteNotesProps {
  planificationId: string;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export function PlanificationAthleteNotes({
  planificationId,
}: PlanificationAthleteNotesProps) {
  const [notes, setNotes] = useState<AthleteNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!planificationId || !expanded) return;

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/planifications/${planificationId}/notes`
        );
        if (!response.ok) throw new Error("Error");
        const data = await response.json();
        setNotes(data.data || []);
      } catch (error) {
        console.error("Error fetching athlete notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [planificationId, expanded]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Ver notas de atletas</span>
      </button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Notas de atletas
          {notes.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({notes.length})
            </span>
          )}
        </h4>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ocultar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">
          No hay notas de atletas para esta planificación.
        </p>
      ) : (
        <div className="space-y-2 max-sm:space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 max-sm:p-2 rounded-lg bg-muted/40 border border-border/30"
            >
              <div className="flex items-start gap-2.5 max-sm:gap-2">
                <Avatar className="w-7 h-7 max-sm:w-6 max-sm:h-6 shrink-0">
                  <AvatarFallback className="text-[10px] max-sm:text-[9px] bg-primary/10 text-primary">
                    {getInitials(note.user.name, note.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs max-sm:text-[11px] font-semibold text-primary truncate">
                      {note.user.name || note.user.email.split("@")[0]}
                    </span>
                    <span className="text-[10px] max-sm:text-[9px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="text-sm max-sm:text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words leading-relaxed">
                    {note.note}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
