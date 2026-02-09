import { supabase } from './supabaseClient';

// Ensure bucket exists in Supabase Storage:
// Storage → New bucket → name: popup-images (public)
const BUCKET = 'popup-images';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['jpg', 'jpeg', 'png', 'webp'];

export const validatePopupImage = (file) => {
  if (!file) return '이미지를 선택해주세요.';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED.includes(ext)) return '허용되지 않은 확장자입니다.';
  if (file.size > MAX_SIZE) return '파일 크기는 5MB 이하만 가능합니다.';
  return '';
};

const buildFilePath = (idOrUuid, ext) => {
  const ts = Date.now();
  return `popups/${idOrUuid}-${ts}.${ext}`;
};

export const uploadPopupImage = async (file, idOrUuid) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const path = buildFilePath(idOrUuid, ext);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
};

export const removePopupImageByUrl = async (url) => {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
};
