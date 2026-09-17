import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get("host") || ""

  // Determine if request originates from a multi-tenant subdomain
  // Examples: "valle.myapp.com" or "valle.localhost:3000"
  const currentHost =
    process.env.NODE_ENV === "production"
      ? hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "")
      : hostname.replace(`.localhost:3000`, "")

  const isSubdomain =
    currentHost &&
    currentHost !== hostname &&
    !currentHost.includes("localhost") &&
    currentHost !== "www"

  // 1. Subdomain Handling (Public tenant booking landing page)
  if (isSubdomain) {
    const slug = currentHost
    // If request is not for API or static assets, rewrite internally to /tenants/[slug]
    if (
      !url.pathname.startsWith("/api") &&
      !url.pathname.startsWith("/_next") &&
      !url.pathname.includes(".")
    ) {
      return NextResponse.rewrite(new URL(`/tenants/${slug}${url.pathname}`, req.url))
    }
  }

  // 2. SuperAdmin Panel Protection (/admin)
  if (url.pathname.startsWith("/admin")) {
    const adminToken =
      (await getToken({
        req,
        cookieName: "auth-admin.session-token",
        secret: process.env.NEXTAUTH_SECRET,
      })) ||
      (await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      }))

    if (!adminToken) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", url.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const isSuperAdmin = Boolean(adminToken.isSuperAdmin || (adminToken as any).esSuperAdmin)
    if (!isSuperAdmin) {
      // Non-superadmins are redirected to standard complex dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // 3. Complex Dashboard Protection (/dashboard)
  if (url.pathname.startsWith("/dashboard")) {
    const adminToken =
      (await getToken({
        req,
        cookieName: "auth-admin.session-token",
        secret: process.env.NEXTAUTH_SECRET,
      })) ||
      (await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      }))

    if (!adminToken) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", url.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 4. Customer History Protection (/mis-reservas)
  if (url.pathname.startsWith("/mis-reservas")) {
    const clienteToken =
      (await getToken({
        req,
        cookieName: "auth-cliente.session-token",
        secret: process.env.NEXTAUTH_SECRET,
      })) ||
      (await getToken({
        req,
        cookieName: "auth-admin.session-token",
        secret: process.env.NEXTAUTH_SECRET,
      })) ||
      (await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      }))

    if (!clienteToken) {
      const loginUrl = new URL("/login-cliente", req.url)
      loginUrl.searchParams.set("callbackUrl", url.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/mis-reservas/:path*",
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
}
