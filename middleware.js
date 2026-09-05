import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("astro_token")?.value;

  console.log("TOKEN:", token); 

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};