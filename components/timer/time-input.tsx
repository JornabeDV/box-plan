"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor={id} className="text-xs sm:text-sm">
        {label}
      </Label>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="flex-1 min-w-0">
          <Input
            id={id ? `${id}-minutes` : undefined}
            type="number"
            inputMode="numeric"
            value={value === "" && allowEmpty ? "" : minutes}
            onChange={(e) => handleMinutesChange(e.target.value)}
            min={0}
            disabled={disabled}
            placeholder="0"
            className={cn("w-full px-1 sm:px-3", inputClassName)}
          />
          <span className="text-xs text-muted-foreground mt-1 block truncate">
            min
          </span>
        </div>
        <span className="text-muted-foreground font-medium pb-4">:</span>
        <div className="flex-1 min-w-0">
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
            className={cn("w-full px-1 sm:px-3", inputClassName)}
          />
          <span className="text-xs text-muted-foreground mt-1 block truncate">
            seg
          </span>
        </div>
      </div>
    </div>
  );
}
