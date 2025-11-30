// Domain configuration utility with fallback priority
// Priority: Production Domain → Subdomain → Localhost

export const getAppUrl = (): string => {
  // 1st priority: Lovable subdomain (main deployment)
  const subdomain = import.meta.env.VITE_SUBDOMAIN;
  if (subdomain && subdomain.trim()) {
    return subdomain;
  }

  // 2nd priority: Production domain
  const productionDomain = import.meta.env.VITE_PRODUCTION_DOMAIN;
  if (productionDomain && productionDomain.trim()) {
    return productionDomain;
  }

  // 3rd priority: Localhost (development)
  const localhost = import.meta.env.VITE_LOCALHOST;
  if (localhost && localhost.trim()) {
    return localhost;
  }

  // Fallback to window.location.origin
  return window.location.origin;
};
