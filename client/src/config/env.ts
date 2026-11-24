/** API base URL. Defaults to the same-origin /api path (Vite proxy locally, Nginx in Docker). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
