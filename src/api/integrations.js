/**
 * integrations.js — Supabase migration
 * Re-exports integration helpers from the Supabase integrations layer.
 */
import { integrations } from './supabaseIntegrations';

export const Core = integrations.Core;

export const InvokeLLM = integrations.Core.InvokeLLM;

export const SendEmail = integrations.Core.SendEmail;

export const SendSMS = async (...args) => {
  console.warn('[Supabase] SendSMS requires a Supabase Edge Function.', args);
};

export const UploadFile = integrations.Core.UploadFile;

export const GenerateImage = integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = async (...args) => {
  console.warn('[Supabase] ExtractDataFromUploadedFile requires a Supabase Edge Function.', args);
  return {};
};







