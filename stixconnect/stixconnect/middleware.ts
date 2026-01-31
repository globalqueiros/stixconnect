import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  let payload: any;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const result = await jwtVerify(token, secret);
    payload = result.payload;
  } catch (err) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const nivel = payload.nivel;
  const pathname = req.nextUrl.pathname;

  const ROLE_ROUTES: Record<number, string> = {
    1: "/administrador",
    2: "/supervisor",
    3: "/atendente",
    4: "/atendente",
    5: "/medico",
    6: "/enfermeiro",
    7: "/fisioterapeuta",
    8: "/cuidador",
    9: "/nutricionista",
    10: "/cabeleireiro",
    11: "/psicologa",
    12: "/fonoaudiologia",
    13: "/acupuntura",
    14: "/psicopedagoga_clinica",
    15: "/paciente", // Role de paciente
  };

  const allowedBaseRoute = ROLE_ROUTES[nivel];

  if (!allowedBaseRoute) {
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  }

  if (!pathname.startsWith(allowedBaseRoute)) {
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  }

  return NextResponse.next();
}

// Configuração do matcher para aplicar o middleware apenas nas rotas necessárias
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};