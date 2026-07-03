import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getDevHeaders } from "@/lib/security/headers";

const JWT_SECRET = process.env.JWT_SECRET || "prsto-dev-secret-change-in-production";

const PUBLIC_ROUTES = [
  "/",
  "/prsto",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
  "/api/health",
  "/mock-interview",
  "/recruiters",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isStaticFile = /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname);

  if (isPublic || isStaticFile) {
    const response = NextResponse.next();
    const headers = getDevHeaders();
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Recruiter route protection
  if (pathname.startsWith("/recruiter")) {
    const token = request.cookies.get("prsto_session")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      if (payload.role !== "recruiter" && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      const response = NextResponse.next();
      const headers = getDevHeaders();
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    } catch {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check session cookie (for authenticated routes)
  const sessionCookie = request.cookies.get("elton_os_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For non-API routes, pass through (session is verified server-side)
  const response = NextResponse.next();
  const headers = getDevHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
