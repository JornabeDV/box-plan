"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePlanificationNotes } from "@/hooks/use-planification-notes";
import { MessageSquare, Send, Trash2, Loader2, Users, CheckCircle, ChevronDown, Pencil, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AthleteNotesSectionProps {
  planificationId: string | number | null;
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

export function AthleteNotesSection({
  planificationId,
}: AthleteNotesSectionProps) {
  const { notes, loading, submitting, addNote, deleteNote, updateNote } =
    usePlanificationNotes({ planificationId });
  const [newNote, setNewNote] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const hasOwnNote = notes.some((n) => n.isOwn);
  const displayedNotes = showAll ? notes : notes.slice(0, 3);
  const hasMore = notes.length > 3;

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    const success = await addNote(newNote);
    if (success) {
      setNewNote("");
    }
  };

  return (
    <Card className="bg-surface-container border-outline/20">
      <CardHeader className="h-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-primary" />
          Notas de la comunidad
          {notes.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({notes.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario para nueva nota */}
        <div className="space-y-2">
          {!hasOwnNote ? (
            <>
              <Textarea
                placeholder="Dejá un aporte breve..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[60px] max-sm:min-h-[48px] text-sm max-sm:text-xs resize-none bg-surface-container-low"
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs max-sm:text-[10px] text-muted-foreground">
                  {newNote.length}/100
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newNote.trim() || submitting}
                  className="hover:scale-100 active:scale-100"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 max-sm:w-3 max-sm:h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 max-sm:w-3 max-sm:h-3 mr-1.5" />
                  )}
                  Publicar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm max-sm:text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 max-sm:p-2">
              <CheckCircle className="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5 text-primary shrink-0" />
              <span>Ya publicaste tu aporte para esta planificación.</span>
            </div>
          )}
        </div>

        {/* Listado de notas */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay notas de la comunidad.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sé el primero en compartir tu experiencia.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-sm:space-y-2">
            {displayedNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 max-sm:p-2 rounded-lg bg-surface-container-low border border-outline/10"
              >
                <div className="flex items-start gap-3 max-sm:gap-2">
                  <Avatar className="w-8 h-8 max-sm:w-6 max-sm:h-6 shrink-0">
                    <AvatarFallback className="text-xs max-sm:text-[10px] bg-primary/10 text-primary">
                      {getInitials(note.user.name, note.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-primary truncate">
                          {note.user.name || note.user.email.split("@")[0]}
                        </span>
                        {note.isOwn && (
                          <span className="text-[10px] max-sm:text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                            Vos
                          </span>
                        )}
                      </div>
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
                {note.isOwn && !editingNoteId && (
                  <div className="flex justify-end mt-2 max-sm:mt-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 max-sm:h-8 max-sm:w-8 max-sm:px-0 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditText(note.note);
                      }}
                      title="Editar"
                    >
                      <Pencil className="w-3 h-3 max-sm:w-3.5 max-sm:h-3.5" />
                      <span className="max-sm:hidden ml-1">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 max-sm:h-8 max-sm:w-8 max-sm:px-0 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteNote(note.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3 max-sm:w-3.5 max-sm:h-3.5" />
                      <span className="max-sm:hidden ml-1">Eliminar</span>
                    </Button>
                  </div>
                )}
                {note.isOwn && editingNoteId === note.id && (
                  <div className="mt-2 max-sm:mt-1 space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[48px] max-sm:min-h-[40px] text-sm max-sm:text-xs resize-none bg-surface-container-low"
                      maxLength={100}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs max-sm:text-[10px] text-muted-foreground">
                        {editText.length}/100
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 max-sm:h-6 text-xs max-sm:text-[10px]"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditText("");
                          }}
                        >
                          <X className="w-3 h-3 max-sm:w-2.5 max-sm:h-2.5 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 max-sm:h-6 text-xs max-sm:text-[10px]"
                          disabled={!editText.trim() || submitting}
                          onClick={async () => {
                            const success = await updateNote(note.id, editText);
                            if (success) {
                              setEditingNoteId(null);
                              setEditText("");
                            }
                          }}
                        >
                          {submitting ? (
                            <Loader2 className="w-3 h-3 max-sm:w-2.5 max-sm:h-2.5 mr-1 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3 max-sm:w-2.5 max-sm:h-2.5 mr-1" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {showAll ? (
                  <>
                    <ChevronDown className="w-4 h-4 rotate-180" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Ver {notes.length - 3} nota{notes.length - 3 > 1 ? "s" : ""} más
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
