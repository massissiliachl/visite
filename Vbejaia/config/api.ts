/**
 * URL de l'API backend.
 * En dev : définir EXPO_PUBLIC_API_URL dans Vbejaia/.env
 * Exemple : EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
 *
 * Render (prod) utilise un ancien build tant qu'il n'est pas redéployé —
 * en dev, pointer vers le backend local corrigé.
 */
const RENDER_API = 'https://visitebejai.onrender.com';

const baseUrl = (
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  RENDER_API
);

export const API_BASE_URL = `${baseUrl}/api/reservations-admin`;
export const API_USERS_URL = `${baseUrl}/api/users`;
