'use client'

import { useEffect } from 'react'

/**
 * Script para limpiar caché de la PWA y manejar problemas de caché en iOS/Safari
 * Este componente debe montarse en el layout raíz
 */
export function ClearCacheScript() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Función para limpiar caché de la PWA
    const clearPwaCache = async () => {
      try {
        // Limpiar caches de la API
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }

        // Unregister service workers si existen
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
        }
      } catch (error) {
        console.error('Error clearing PWA cache:', error);
      }
    };

    // Limpiar caché si hay un parámetro de URL específico
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('clear_cache')) {
      clearPwaCache().then(() => {
        // Remover el parámetro de la URL y recargar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        window.location.reload();
      });
    }

    // Detectar si estamos en iOS/Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      // Agregar clase al body para estilos específicos de iOS
      document.body.classList.add('ios-device');
      
      // Forcer recarga sin caché si hay problemas detectados
      const lastReload = sessionStorage.getItem('last_ios_reload');
      const now = Date.now();
      
      if (lastReload && (now - parseInt(lastReload)) < 5000) {
        // Evitar recargas infinitas
        console.warn('[ClearCacheScript] Preventing reload loop on iOS');
      }
    }
  }, []);

  return null;
}

/**
 * Función utilitaria para forzar recarga sin caché
 */
export function forceReloadWithoutCache() {
  if (typeof window === 'undefined') return;
  
  // Agregar timestamp a la URL para evitar cache
  const separator = window.location.href.includes('?') ? '&' : '?';
  window.location.href = `${window.location.href}${separator}_nocache=${Date.now()}`;
}

/**
 * Función utilitaria para limpiar todo el almacenamiento y recargar
 */
export function clearAllAndReload() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    window.location.href = '/login?clear_cache=1';
  } catch (error) {
    console.error('Error clearing storage:', error);
    window.location.reload();
  }
}
