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
    1: "/paciente",      // paciente básico
    2: "/paciente",      // paciente premium
    3: "/paciente",      // paciente VIP
    4: "/atendente",
    5: "/medico",
    6: "/enfermeiro",
    7: "/fisioterapeuta",
    8: "/cuidador",
    9: "/nutricionista",
    10: "/cabineleiro",
    11: "/psicologia",
    12: "/fonoaudiologia",
    13: "/acupuntura",
    14: "/psicopedagogia-clinica",
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