/**
 * supabaseClient.js
 * Central export — mirrors the base44 SDK surface used throughout the app.
 *
 * Usage (no changes needed in pages/components):
 *   import { base44 } from '@/api/base44Client';
 *   base44.auth.me()
 *   base44.entities.Post.list()
 *   base44.integrations.Core.UploadFile({ file })
 */
import { auth }         from './supabaseAuth';
import { entities }     from './supabaseEntities';
import { integrations } from './supabaseIntegrations';

const analytics = {
  track({ eventName, properties } = {}) {
    console.debug('[analytics]', eventName, properties);
  },
};

const users = {
  async inviteUser(email, role = 'user') {
    console.warn('[Supabase] inviteUser must be handled via Supabase Admin API / Edge Function.', { email, role });
  },
};

export const base44 = { auth, entities, integrations, analytics, users };