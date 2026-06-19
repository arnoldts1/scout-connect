/**
 * app-params.js — Supabase migration stub
 *
 * This file previously provided Base44 platform parameters (appId, serverUrl, token).
 * After migrating to Supabase, those parameters are no longer needed.
 * Supabase credentials are now read from environment variables:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * This stub is kept for backward compatibility in case anything still imports it.
 */
export const appParams = {};
