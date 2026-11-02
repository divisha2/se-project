import path from 'path';
import fs from 'fs/promises';
import { STORAGE_BUCKET, supabase, isSupabaseStorageConfigured } from '../config/supabase';
import { ApiError } from './ApiError';

export const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);

export const getLocalStorageDir = () => {
  return path.basename(process.cwd()).toLowerCase() === 'backend'
    ? path.resolve(process.cwd(), 'uploads')
    : path.resolve(process.cwd(), 'backend', 'uploads');
};

export const uploadBuffer = async (storagePath: string, buffer: Buffer, contentType: string) => {
  if (isSupabaseStorageConfigured() && supabase) {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw new ApiError(502, `File storage failed: ${error.message}`);
    return;
  }

  // Local filesystem storage fallback
  const fullPath = path.join(getLocalStorageDir(), storagePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
};

export const downloadBuffer = async (storagePath: string): Promise<Buffer> => {
  if (isSupabaseStorageConfigured() && supabase) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
    if (error || !data) throw new ApiError(502, `File download failed: ${error?.message ?? 'no data'}`);
    return Buffer.from(await data.arrayBuffer());
  }

  // Local filesystem storage fallback
  const fullPath = path.join(getLocalStorageDir(), storagePath);
  try {
    return await fs.readFile(fullPath);
  } catch (err: any) {
    throw new ApiError(404, `Local file not found: ${storagePath}`);
  }
};

export const signedUrl = async (storagePath: string, seconds = 300, downloadName?: string) => {
  if (isSupabaseStorageConfigured() && supabase) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, seconds, downloadName ? { download: downloadName } : undefined);
    if (error || !data) throw new ApiError(502, `Could not create download link: ${error?.message ?? ''}`);
    return data.signedUrl;
  }

  // Local filesystem storage fallback
  const query = new URLSearchParams({
    path: storagePath,
    ...(downloadName ? { name: downloadName } : {}),
  });
  return `/api/storage/files?${query.toString()}`;
};
