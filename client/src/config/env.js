/**
 * API anahtarları ve ortam değişkenleri.
 * PROJECT_GUIDE.md: "API anahtarları asla koda direkt yazılmayacak, .env dosyasından okunacak."
 * Kullanım: .env dosyasında VITE_ ile başlayan değişkenler tanımlanır; bu modül üzerinden okunur.
 */

export function getApiKey() {
  return import.meta.env.VITE_API_KEY ?? '';
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

/** API isteklerinde kullanılmak üzere güvenli header (örnek). */
export function getAuthHeaders() {
  const key = getApiKey();
  if (!key) return {};
  return { Authorization: `Bearer ${key}` };
}
