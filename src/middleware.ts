import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const PUBLIC_PAGES = ["/login"];
const ADMIN_PAGE_PREFIXES = ["/staff"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isApi = pathname.startsWith("/api");
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const isAuthApi = pathname === "/api/auth/login";

  if (!session) {
    if (isAuthApi || isPublicPage) return NextResponse.next();
    if (isApi) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAdminPage = ADMIN_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAdminPage && session.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)"],
};
