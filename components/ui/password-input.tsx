"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  containerClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(
      ref,
      () => inputRef.current as HTMLInputElement,
      []
    );

    const focusInput = React.useCallback((input: HTMLInputElement) => {
      const { selectionStart, selectionEnd, selectionDirection } = input;
      input.focus();
      // Restaurar cursor/selección para que el teclado no salte ni se cierre.
      if (selectionStart !== null && selectionEnd !== null) {
        requestAnimationFrame(() => {
          input.setSelectionRange(
            selectionStart,
            selectionEnd,
            (selectionDirection as "forward" | "backward" | "none") || undefined
          );
        });
      }
    }, []);

    const togglePassword = React.useCallback(
      (event?: React.PointerEvent<HTMLButtonElement>) => {
        // Evita que el botón robe el foco del input en iOS/Safari.
        event?.preventDefault();

        setShowPassword((prev) => {
          const next = !prev;
          const input = inputRef.current;
          if (input) {
            // iOS a veces no refresca el cambio de type mientras el input
            // tiene foco. Forzamos un blur/focus para que Safari repinte.
            input.blur();
            requestAnimationFrame(() => focusInput(input));
          }
          return next;
        });
      },
      [focusInput]
    );

    return (
      <div className={cn("relative", containerClassName)}>
        <Input
          key={showPassword ? "text" : "password"}
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          className={cn("pr-12", className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={() => togglePassword()}
          onPointerDown={(e) => togglePassword(e)}
          disabled={disabled}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={showPassword}
          tabIndex={-1}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2",
            "h-12 w-12 flex items-center justify-center",
            "text-muted-foreground hover:text-foreground transition-colors",
            "touch-manipulation select-none",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
