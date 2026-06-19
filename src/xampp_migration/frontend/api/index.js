/**
 * api/index.js  –  drop-in replacement for @/api/base44Client
 *
 * Usage (same as before):
 *   import { base44 } from '@/api/base44Client';
 *   base44.entities.Post.list()
 *   base44.auth.me()
 *   base44.integrations.Core.UploadFile(...)
 *
 * In the migrated app, point the alias in vite.config.js:
 *   resolve: { alias: { '@/api/base44Client': './src/api/index.js' } }
 */

import { auth }     from './auth';
import { entities } from './entities';
import { http }     from './client';

/** Minimal integrations shim – only UploadFile is truly needed in the migrated app */
const integrations = {
  Core: {
    /** Upload a file via the PHP upload endpoint */
    async UploadFile({ file }) {
      const form = new FormData();
      form.append('file', file);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost/scout_connect/backend'}/api/upload`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        }
      );
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return { file_url: data.file_url };
    },

    /** InvokeLLM – requires a separate AI service; returns empty stub */
    async InvokeLLM({ prompt, response_json_schema }) {
      console.warn('[integrations] InvokeLLM not available in standalone mode.');
      return response_json_schema ? {} : '';
    },

    /** SendEmail – wire up to your SMTP backend if needed */
    async SendEmail({ to, subject, body: emailBody }) {
      return http.post('api/send_email', { to, subject, body: emailBody });
    },
  },
};

/** analytics stub */
const analytics = {
  track({ eventName, properties }) {
    // Optionally log to your own analytics endpoint
    console.debug('[analytics]', eventName, properties);
  },
};

export const base44 = { auth, entities, integrations, analytics };