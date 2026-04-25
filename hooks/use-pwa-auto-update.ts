"use client";

import { useEffect, useRef } from "react";
import { useSerwist } from "@serwist/next/react";

const SESSION_KEY = "pwa_session_active";

interface SerwistLifecycleEvent {
  isUpdate?: boolean;
  isExternal?: boolean;
  sw?: ServiceWorker;
  originalEvent?: Event;
  type: string;
  target: unknown;
}

/**
 * Hook que maneja la actualización automática de la PWA.
 *
 * - En apertura fresca (app cerrada → abierta): si hay una nueva versión del
 *   service worker, fuerza su activación y recarga la página automáticamente.
 *   El usuario no nota la recarga porque ocurre durante el arranque.
 *
 * - En vuelta de background: solo fuerza el chequeo del service worker sin
 *   recargar, dejando que la nueva versión se aplique en la próxima apertura.
 */
export function usePwaAutoUpdate() {
  const { serwist } = useSerwist();
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!serwist) return;
    if (handledRef.current) return;
    handledRef.current = true;

    const isFreshOpen = !sessionStorage.getItem(SESSION_KEY);

    if (isFreshOpen) {
      sessionStorage.setItem(SESSION_KEY, "true");

      const handleInstalled = (event: SerwistLifecycleEvent) => {
        if (event.isUpdate) {
          // El nuevo SW está instalado. Con skipWaiting:true en el SW,
          // esto es redundante pero no hace daño.
          serwist.messageSkipWaiting();
        }
      };

      const handleControlling = (event: SerwistLifecycleEvent) => {
        if (event.isUpdate) {
          // El nuevo SW tomó control. Recargamos para que la app cargue
          // con la nueva versión sin que el usuario tenga que desinstalar.
          window.location.reload();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serwist.addEventListener("installed", handleInstalled as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serwist.addEventListener("controlling", handleControlling as any);

      // Forzar chequeo inmediato de si hay un nuevo SW
      serwist.update().catch(() => {
        // Silenciar errores (ej. sin conexión)
      });

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serwist.removeEventListener("installed", handleInstalled as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serwist.removeEventListener("controlling", handleControlling as any);
      };
    }

    // Sesión existente (usuario volvió de background):
    // Solo chequeamos si hay una nueva versión, pero NO recargamos.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        serwist.update().catch(() => {
          // Silenciar errores
        });
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [serwist]);
}
