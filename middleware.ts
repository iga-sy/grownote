import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const providedUser = decoded.slice(0, separatorIndex);
    const providedPassword = decoded.slice(separatorIndex + 1);
    if (providedUser === user && providedPassword === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("認証が必要です。", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GrowNote"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
