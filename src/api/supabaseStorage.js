/**
 * Supabase Storage service — replaces base44 UploadFile integration
 *
 * Buckets used:
 *   avatars      — profile pictures
 *   media        — post images / videos / stories
 *   documents    — PDFs, attachments
 *   audio        — voice messages, music
 */
import { supabase } from '@/lib/supabase';

const BUCKET_RULES = [
  { bucket: 'audio',     exts: ['mp3', 'ogg', 'wav', 'm4a', 'flac'] },
  { bucket: 'documents', exts: ['pdf', 'doc', 'docx', 'xls', 'xlsx'] },
  { bucket: 'avatars',   exts: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
  { bucket: 'media',     exts: [] }, // catch-all
];

function getBucket(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return BUCKET_RULES.find(r => r.exts.includes(ext))?.bucket ?? 'media';
}

/**
 * Upload a File object to Supabase Storage.
 * Returns { file_url: string } to match the base44 Core.UploadFile interface.
 */
export async function uploadFile(file) {
  // Validate file exists
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is 50MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const bucket = getBucket(file.name);
  const path = `${crypto.randomUUID()}.${ext}`;

  try {
    // Set a timeout for the upload
    const uploadPromise = supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout - took longer than 5 minutes')), 300000)
    );

    const { error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.error(`Upload error:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data, error: urlError } = supabase.storage.from(bucket).getPublicUrl(path);
    if (urlError || !data?.publicUrl) {
      throw new Error('Failed to get public URL after upload');
    }

    console.log(`✅ Upload successful: ${file.name} → ${data.publicUrl}`);
    return { file_url: data.publicUrl };
  } catch (error) {
    console.error(`Upload error for file ${file.name}:`, error);
    throw new Error(`File upload failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete a file by its public URL.
 */
export async function deleteFile(publicUrl) {
  // Extract bucket and path from URL
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) throw new Error('Cannot parse storage URL: ' + publicUrl);
  const [, bucket, path] = match;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
