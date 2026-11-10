import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || undefined,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('session-expired'));
    }
    return Promise.reject(error);
  },
);
export type User = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
};
export type Content = {
  id: string;
  domain: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  cover_url?: string | null;
  backdrop_url?: string | null;
  release_date?: string | null;
  genres?: string[];
  external_provider?: string | null;
  external_id?: string | null;
};
export type Review = {
  id: string;
  author_id: string;
  content_id: string;
  rating: number;
  title: string | null;
  text: string;
  spoiler: boolean;
  created_at?: string;
  updated_at?: string;
};
export type Product = {
  name: string;
  color: string;
  domains: string[];
  features: string[];
};
export function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item?.msg === 'string' ? item.msg : ''))
        .filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
    return 'Não foi possível processar a solicitação.';
  }
  return 'Não foi possível processar a solicitação.';
}
