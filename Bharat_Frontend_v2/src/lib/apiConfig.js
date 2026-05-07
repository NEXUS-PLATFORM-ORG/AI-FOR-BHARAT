// Central API configuration.
// In development (npm run dev):  uses http://localhost:5000/api/v1
// In production (Vite build):   uses VITE_API_BASE from .env.production
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api/v1";

export const API_BASE      = BASE;
export const API_CASES     = `${BASE}/cases`;
export const API_AUTH      = `${BASE}/auth`;
export const API_USERS     = `${BASE}/users`;
export const API_PROFILE   = `${BASE}/profile`;
export const API_NOTIF     = `${BASE}/notifications`;
