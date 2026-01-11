import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Verificar se há um token de sessão no cookie (NextAuth v5)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Se não houver token, proteger as rotas
  if (!sessionToken) {
    // Redirecionar dashboards para login
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Para APIs protegidas, retornar 401
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/guides/:path*",
    "/api/facials/:path*",
    "/api/sessions/:path*",
    "/api/activities/:path*",
    "/api/psychologists/:path*",
    "/api/links/:path*",
    "/api/references/:path*",
    "/api/balance/:path*",
  ],
};
