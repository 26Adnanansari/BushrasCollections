import Cookies from 'js-cookie';

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const setCookie = (
  name: string,
  value: string,
  options?: Cookies.CookieAttributes
): void => {
  Cookies.set(name, value, {
    expires: 30, // 30 days default
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
    ...options,
  });
};

export const deleteCookie = (name: string): void => {
  Cookies.remove(name);
};

export const getJsonCookie = <T>(name: string): T | null => {
  const cookie = getCookie(name);
  if (!cookie) return null;
  
  try {
    return JSON.parse(cookie) as T;
  } catch {
    return null;
  }
};

export const setJsonCookie = <T>(
  name: string,
  value: T,
  options?: Cookies.CookieAttributes
): void => {
  setCookie(name, JSON.stringify(value), options);
};
