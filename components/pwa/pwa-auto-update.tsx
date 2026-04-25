"use client";

import { usePwaAutoUpdate } from "@/hooks/use-pwa-auto-update";

/**
 * Componente invisible que gestiona la actualización automática de la PWA.
 *
 * Debe montarse dentro de <SerwistProvider> para que el hook useSerwist
 * tenga acceso al contexto.
 */
export function PwaAutoUpdate() {
  usePwaAutoUpdate();
  return null;
}
