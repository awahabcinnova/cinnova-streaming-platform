const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/media/')) return `${BACKEND_BASE_URL}${url}`;
  return url;
};
