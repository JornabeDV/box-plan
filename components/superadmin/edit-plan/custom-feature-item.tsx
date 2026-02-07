"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CustomFeatureItemProps {
  featureKey: string;
  value: any;
  type: "boolean" | "number" | "string";
  onValueChange: (value: boolean | number | string) => void;
  onRemove: () => void;
}

export function CustomFeatureItem({
  featureKey,
  value,
  type,
  onValueChange,
  onRemove,
}: CustomFeatureItemProps) {
  const handleValueChange = (newValue: string) => {
    if (type === "boolean") {
      onValueChange(newValue === "true");
    } else if (type === "number") {
      onValueChange(parseFloat(newValue) || 0);
    } else {
      onValueChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <div className="flex-1 grid grid-cols-[3fr_1fr_1fr] gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <div className="text-sm font-medium">{featureKey}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <div className="text-xs text-muted-foreground capitalize">{type}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Valor</Label>
          {type === "boolean" ? (
            <Switch
              checked={value === true}
              onCheckedChange={(checked) => onValueChange(checked)}
            />
          ) : type === "number" ? (
            <Input
              type="number"
              value={value as number}
              onChange={(e) => handleValueChange(e.target.value)}
              className="h-8 text-sm"
            />
          ) : (
            <Input
              value={value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              className="h-8 text-sm"
            />
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
