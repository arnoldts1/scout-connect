/**
 * entities.js — Supabase migration
 * Re-exports entity operations and User auth from the Supabase layer.
 */
export { entities as Query } from './supabaseEntities';
export { auth as User } from './supabaseAuth';