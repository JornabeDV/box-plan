import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}


export const config = {
  matcher: [
    "/admin-dashboard/:path*",
  ],
}