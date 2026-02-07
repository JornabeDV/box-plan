"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PlanBasicInfoFormProps {
  displayName: string;
  basePrice: number;
  minStudents: number;
  maxStudents: number;
  commissionRate: number;
  maxStudentPlans: number;
  onChange: (field: string, value: string | number) => void;
}

export function PlanBasicInfoForm({
  displayName,
  basePrice,
  minStudents,
  maxStudents,
  commissionRate,
  maxStudentPlans,
  onChange,
}: PlanBasicInfoFormProps) {
  const handleMaxStudentsChange = (value: string) => {
    if (!value || value === "") {
      onChange("maxStudents", 10);
    } else if (value === "999999" || parseInt(value) >= 999999) {
      onChange("maxStudents", 999999);
    } else {
      onChange("maxStudents", parseInt(value) || 10);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nombre para Mostrar</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            required
            className="text-sm placeholder:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Precio Base</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            className="text-sm placeholder:text-sm"
            value={basePrice}
            onChange={(e) =>
              onChange("basePrice", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minStudents">Estudiantes Mínimos</Label>
          <Input
            id="minStudents"
            type="number"
            className="text-sm placeholder:text-sm"
            value={minStudents}
            onChange={(e) =>
              onChange("minStudents", parseInt(e.target.value) || 1)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStudents">Estudiantes Máximos</Label>
          <Input
            id="maxStudents"
            type="number"
            className="text-sm placeholder:text-sm"
            value={maxStudents === 999999 ? "" : maxStudents}
            onChange={(e) => handleMaxStudentsChange(e.target.value)}
            placeholder="999999 para ilimitados"
            required
          />
          <p className="text-xs text-muted-foreground">
            Ingresa 999999 para estudiantes ilimitados
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="commissionRate">Comisión (%)</Label>
          <Input
            id="commissionRate"
            type="number"
            step="0.01"
            value={commissionRate}
            onChange={(e) =>
              onChange("commissionRate", parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStudentPlans">Máx. Planes de Estudiantes</Label>
          <Input
            id="maxStudentPlans"
            type="number"
            value={maxStudentPlans}
            onChange={(e) =>
              onChange("maxStudentPlans", parseInt(e.target.value) || 0)
            }
            required
          />
          <p className="text-xs text-muted-foreground">
            Cantidad de planes de suscripción que el coach puede crear
          </p>
        </div>
      </div>
    </>
  );
}
