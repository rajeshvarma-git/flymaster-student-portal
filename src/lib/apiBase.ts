import { Capacitor } from '@capacitor/core';

/** Backend base URL. Empty string = same origin (Vite dev server). */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (configured?.trim()) return configured.trim().replace(/\/$/, '');

  if (Capacitor.isNativePlatform()) {
    // Android emulator: host machine is 10.0.2.2; iOS simulator: localhost
    if (Capacitor.getPlatform() === 'android') return 'http://10.0.2.2:8087';
    return 'http://localhost:8087';
  }

  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
