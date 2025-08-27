import { useLocation } from 'react-router-dom';

export const DEFAULT_TENANT = 'auranova'; // cámbialo si tu slug base es otro

export const currentTenantSlug = (): string => {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/t\/([^\/]+)/);
  return match ? match[1] : DEFAULT_TENANT;
};

export const useTenantSlug = (): string => {
  const location = useLocation();
  const match = location.pathname.match(/^\/t\/([^\/]+)/);
  return match ? match[1] : DEFAULT_TENANT;
};

export const getTenantPath = (slug: string, path: string = ''): string => {
  return `/t/${slug}${path}`;
};
