"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentDisciplinesManager } from "./student-disciplines-manager";

interface UserDisciplinesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  coachId: string | null;
}

export function UserDisciplinesModal({
  open,
  onOpenChange,
  user,
  coachId,
}: UserDisciplinesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Disciplinas del Estudiante
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <StudentDisciplinesManager
            studentId={user?.id || null}
            studentName={user?.full_name || user?.email || "Estudiante"}
            coachId={coachId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
