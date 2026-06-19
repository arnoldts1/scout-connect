/**
 * base44Client.js
 *
 * Supabase migration shim — re-exports the Supabase-backed `base44` object.
 * All pages and components that import `{ base44 }` from this file will
 * automatically use Supabase with no changes needed in those files.
 */
export { base44 } from './supabaseClient';