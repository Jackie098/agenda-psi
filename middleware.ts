import { auth } from "@/lib/auth";

export default auth((req) => {
  // req.auth
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/guides/:path*", "/api/facials/:path*", "/api/sessions/:path*", "/api/psychologists/:path*", "/api/links/:path*", "/api/references/:path*", "/api/balance/:path*"],
};

