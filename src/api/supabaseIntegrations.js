/**
 * Supabase Integrations — replaces base44.integrations.Core.*
 *
 * Core.UploadFile  → Supabase Storage
 * Core.InvokeLLM   → warn (requires an Edge Function or external API key)
 * Core.SendEmail   → warn (requires Supabase Edge Function + Resend/SendGrid)
 */
import { uploadFile } from './supabaseStorage';

export const integrations = {
  Core: {
    async UploadFile({ file }) {
      return uploadFile(file);
    },

    async InvokeLLM({ prompt, response_json_schema } = {}) {
      console.warn('[Supabase] InvokeLLM requires a Supabase Edge Function. Prompt:', prompt);
      return response_json_schema ? {} : '';
    },

    async SendEmail({ to, subject, body } = {}) {
      console.warn('[Supabase] SendEmail requires a Supabase Edge Function.', { to, subject });
    },

    async GenerateImage() {
      console.warn('[Supabase] GenerateImage requires a Supabase Edge Function.');
      return { url: '' };
    },

    async GenerateSpeech() {
      console.warn('[Supabase] GenerateSpeech requires a Supabase Edge Function.');
      return { url: '' };
    },
  },
};