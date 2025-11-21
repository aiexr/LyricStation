export function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function setCookie(name: string, value: string) {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getCookieJSON<T>(name: string): T | null {
  const raw = getCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCookieJSON(name: string, value: unknown) {
  setCookie(name, JSON.stringify(value));
}
