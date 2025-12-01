"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddCustomFeatureFormProps {
  onAdd: (key: string, value: boolean | number | string) => void;
  existingKeys: string[];
}

export function AddCustomFeatureForm({
  onAdd,
  existingKeys,
}: AddCustomFeatureFormProps) {
  const { toast } = useToast();
  const [featureKey, setFeatureKey] = useState("");
  const [featureType, setFeatureType] = useState<
    "boolean" | "number" | "string"
  >("boolean");
  const [featureValue, setFeatureValue] = useState<string>("");

  const handleAdd = () => {
    if (!featureKey.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la característica es requerido",
        variant: "destructive",
      });
      return;
    }

    if (existingKeys.includes(featureKey)) {
      toast({
        title: "Error",
        description: "Esta característica ya existe",
        variant: "destructive",
      });
      return;
    }

    let value: boolean | number | string;
    if (featureType === "boolean") {
      value = featureValue === "true";
    } else if (featureType === "number") {
      value = parseFloat(featureValue) || 0;
    } else {
      value = featureValue;
    }

    onAdd(featureKey, value);

    // Reset form
    setFeatureKey("");
    setFeatureType("boolean");
    setFeatureValue("");
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <Label className="text-sm font-medium">
        Agregar Nueva Característica
      </Label>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Input
            placeholder="nombre_caracteristica"
            value={featureKey}
            onChange={(e) =>
              setFeatureKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))
            }
            className="text-sm"
          />
        </div>
        <div className="col-span-3">
          <Select
            value={featureType}
            onValueChange={(value: "boolean" | "number" | "string") => {
              setFeatureType(value);
              setFeatureValue("");
            }}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">Booleano</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="string">Texto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-4">
          {featureType === "boolean" ? (
            <Select value={featureValue} onValueChange={setFeatureValue}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Valor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Verdadero</SelectItem>
                <SelectItem value="false">Falso</SelectItem>
              </SelectContent>
            </Select>
          ) : featureType === "number" ? (
            <Input
              type="number"
              placeholder="0"
              value={featureValue}
              onChange={(e) => setFeatureValue(e.target.value)}
              className="text-sm"
            />
          ) : (
            <Input
              placeholder="Valor"
              value={featureValue}
              onChange={(e) => setFeatureValue(e.target.value)}
              className="text-sm"
            />
          )}
        </div>
        <div className="col-span-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="w-full"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Usa nombres en minúsculas con guiones bajos (ej: nueva_funcionalidad)
      </p>
    </div>
  );
}
