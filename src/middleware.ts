import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'segredo-super-seguro');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  console.log('MIDDLEWARE: token recebido:', token);

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    console.log('MIDDLEWARE: Sem token, redirecionando para /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      console.log('MIDDLEWARE: Token válido! Decoded:', payload);
    } catch (err) {
      console.log('MIDDLEWARE: Token inválido ou expirado:', err);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
}; 