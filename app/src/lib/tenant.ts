// app/src/lib/tenant.ts
import { useLocation } from "react-router-dom";

export const DEFAULT_TENANT = "auranova";

// Coincide /t/<slug> al inicio del path (sin escapes innecesarios dentro del class)
const TENANT_RE = /^\/t\/([^/]+)/;

export const currentTenantSlug = (): string => {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const match = pathname.match(TENANT_RE);
  return match ? match[1] : DEFAULT_TENANT;
};

export const useTenantSlug = (): string => {
  const location = useLocation();
  const match = location.pathname.match(TENANT_RE);
  return match ? match[1] : DEFAULT_TENANT;
};

export const getTenantPath = (slug: string, path: string = ""): string => {
  return `/t/${slug}${path}`;
};
