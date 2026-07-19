"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoundsInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  inputClassName?: string;
}

export function RoundsInput({
  id,
  label = "Rondas",
  value,
  onChange,
  disabled = false,
  min = 1,
  max,
  placeholder = "1",
  inputClassName,
}: RoundsInputProps) {
  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange("");
      return;
    }

    if (!/^\d+$/.test(raw)) {
      onChange(String(min));
      return;
    }

    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) {
      onChange(String(min));
      return;
    }

    if (num < min) {
      onChange(String(min));
      return;
    }

    if (max !== undefined && num > max) {
      onChange(String(max));
      return;
    }

    onChange(raw);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
      />
      {/* Espaciador para alinear con los textos min/seg de TimeInput */}
      <span className="text-xs text-muted-foreground mt-1 block invisible">&nbsp;</span>
    </div>
  );
}
