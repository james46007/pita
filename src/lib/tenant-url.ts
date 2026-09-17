/**
 * Resolves tenant URLs dynamically based on environment and domain configuration.
 *
 * - On Vercel free domains (*.vercel.app): Wildcard subdomains are not supported by Vercel DNS/SSL,
 *   so it uses path-based routing: https://[host]/tenants/[slug][path]
 * - On localhost: Uses http://[slug].localhost:[port][path]
 * - On custom domains (when NEXT_PUBLIC_ROOT_DOMAIN is set): Uses https://[slug].[rootDomain][path]
 */
export function getTenantUrl(slug: string, path = ""): string {
  const normalizedPath = path.startsWith("/") ? path : path ? `/${path}` : ""

  if (typeof window !== "undefined") {
    const host = window.location.host
    const protocol = window.location.protocol

    // Vercel default domain (*.vercel.app) cannot handle wildcard subdomains
    if (host.includes("vercel.app")) {
      return `${protocol}//${host}/tenants/${slug}${normalizedPath}`
    }

    // Localhost subdomain support (e.g. padel-norte.localhost:3000)
    if (host.includes("localhost")) {
      const port = window.location.port ? `:${window.location.port}` : ""
      return `${protocol}//${slug}.localhost${port}${normalizedPath}`
    }

    // Custom domain configured
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    if (rootDomain && !rootDomain.includes("localhost")) {
      return `${protocol}//${slug}.${rootDomain}${normalizedPath}`
    }

    // Fallback on current host
    return `${protocol}//${host}/tenants/${slug}${normalizedPath}`
  }

  // Server-side fallback
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain) {
    if (rootDomain.includes("localhost")) {
      return `http://${slug}.${rootDomain}${normalizedPath}`
    }
    const protocol = process.env.NODE_ENV === "production" ? "https:" : "http:"
    return `${protocol}//${slug}.${rootDomain}${normalizedPath}`
  }

  return `/tenants/${slug}${normalizedPath}`
}
