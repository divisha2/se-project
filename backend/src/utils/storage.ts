import { STORAGE_BUCKET, supabase } from '../config/supabase';
import { ApiError } from './ApiError';

export const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);

export const uploadBuffer = async (path: string, buffer: Buffer, contentType: string) => {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new ApiError(502, `File storage failed: ${error.message}`);
};

export const downloadBuffer = async (path: string): Promise<Buffer> => {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) throw new ApiError(502, `File download failed: ${error?.message ?? 'no data'}`);
  return Buffer.from(await data.arrayBuffer());
};

export const signedUrl = async (path: string, seconds = 300, downloadName?: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, seconds, downloadName ? { download: downloadName } : undefined);
  if (error || !data) throw new ApiError(502, `Could not create download link: ${error?.message ?? ''}`);
  return data.signedUrl;
};
