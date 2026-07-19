"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function sanitizeInt(
  value: string,
  options: { max?: number; min?: number; allowEmpty?: boolean } = {}
): string {
  const { max, min = 0, allowEmpty = false } = options;

  if (value === "") {
    return allowEmpty ? "" : String(min);
  }

  if (!/^\d+$/.test(value)) {
    return String(min);
  }

  const num = parseInt(value, 10);
  if (Number.isNaN(num)) return String(min);
  if (num < min) return String(min);
  if (max !== undefined && num > max) return String(max);

  return value;
}

interface TimeInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  inputClassName?: string;
}

export function TimeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  allowEmpty = false,
  min = 0,
  max,
  inputClassName,
}: TimeInputProps) {
  const totalSeconds = value === "" && allowEmpty ? 0 : parseInt(value || "0", 10) || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const handleMinutesChange = (raw: string) => {
    if (allowEmpty && raw === "") {
      onChange("");
      return;
    }

    const sanitized = sanitizeInt(raw, { min: 0, max: max ? Math.floor(max / 60) : undefined });
    const newMinutes = parseInt(sanitized || "0", 10) || 0;
    const newTotal = newMinutes * 60 + seconds;
    onChange(String(newTotal));
  };

  const handleSecondsChange = (raw: string) => {
    if (allowEmpty && raw === "") {
      onChange("");
      return;
    }

    const sanitized = sanitizeInt(raw, { min: 0, max: 59 });
    const newSeconds = parseInt(sanitized || "0", 10) || 0;
    const newTotal = minutes * 60 + newSeconds;
    onChange(String(newTotal));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            id={id ? `${id}-minutes` : undefined}
            type="number"
            inputMode="numeric"
            value={value === "" && allowEmpty ? "" : minutes}
            onChange={(e) => handleMinutesChange(e.target.value)}
            min={0}
            disabled={disabled}
            placeholder="0"
            className={inputClassName}
          />
          <span className="text-xs text-muted-foreground mt-1 block">min</span>
        </div>
        <span className="text-muted-foreground font-medium">:</span>
        <div className="flex-1">
          <Input
            id={id ? `${id}-seconds` : undefined}
            type="number"
            inputMode="numeric"
            value={value === "" && allowEmpty ? "" : seconds}
            onChange={(e) => handleSecondsChange(e.target.value)}
            min={0}
            max={59}
            disabled={disabled}
            placeholder="00"
            className={inputClassName}
          />
          <span className="text-xs text-muted-foreground mt-1 block">seg</span>
        </div>
      </div>
    </div>
  );
}
