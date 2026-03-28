import { NextRequest, NextResponse } from "next/server";
import { setCompanyContext } from "@/lib/tenant-context";
import jwt from "jsonwebtoken";
import { getAuthServer } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/login",
  "/api/register",
  "/"
];

const JWT_SECRET = process.env.JWT_SECRET;
const getSecret = () => {
  if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production.');
  }
  return JWT_SECRET || "dev-only-unsafe-secret";
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = getAuthServer(request);
  const secret = getSecret();

  if (token) {
    try {
      const payload = jwt.verify(token, secret) as { role?: string; companyId?: number };
      setCompanyContext(payload.companyId);
    } catch {
      /* ignore invalid token here; handled later */
    }
  }
  if (!token) {
    // Redirect to login page if not authenticated
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode role
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    const role = payload.role ?? "STAFF";
    const adminRoles = [
      "OWNER",
      "ADMIN",
      "MANAGING_PARTNER",
      "ACCOUNTANT_MASTER",
      "ACCOUNTANT_ASSISTANT",
      "HR_MANAGER",
      "HR",
      "LAWYER_PARTNER",
      "LAWYER_MANAGER",
    ];
    const invoiceRoles = ["OWNER", "ADMIN", "MANAGING_PARTNER", "ACCOUNTANT_MASTER", "ACCOUNTANT_ASSISTANT"];

    if (pathname.startsWith("/admin") && !adminRoles.includes(role)) {
      const dashUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashUrl);
    }
    if (pathname.startsWith("/invoices") && !invoiceRoles.includes(role)) {
      const dashUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashUrl);
    }
  } catch {
    // invalid token => redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // apply to all API routes and pages except static/image/favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
