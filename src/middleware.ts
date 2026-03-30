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

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Decode role
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    const role = payload.role ?? "STAFF";
    const SUPER = ["OWNER", "MANAGING_PARTNER"];
    const ACCOUNTING_ALL = [...SUPER, "ACCOUNTANT_MASTER"];
    const ACCOUNTING_ASSIST = [...ACCOUNTING_ALL, "ACCOUNTANT_ASSISTANT"];
    const HR_ALL = [...SUPER, "HR_MANAGER", "HR"];
    const REPORTS_ROLES = [...SUPER, "ACCOUNTANT_MASTER", "ADMIN", "LAWYER_PARTNER", "LAWYER_MANAGER"];
    const INVOICE_ROLES = [...SUPER, "ACCOUNTANT_MASTER", "ACCOUNTANT_ASSISTANT", "LAWYER_PARTNER"];

    const deny = () => NextResponse.redirect(new URL("/dashboard", request.url));

    if (pathname.startsWith("/accounts") && !ACCOUNTING_ASSIST.includes(role)) return deny();
    if (pathname.startsWith("/invoices") && !INVOICE_ROLES.includes(role)) return deny();

    if (pathname.startsWith("/clients")) {
      const allowClients = [...ACCOUNTING_ASSIST, "ADMIN", "LAWYER_PARTNER", "LAWYER_MANAGER"];
      if (!allowClients.includes(role)) return deny();
    }

    if (pathname.startsWith("/projects")) {
      const allowProjects = [...ACCOUNTING_ASSIST, "ADMIN", "LAWYER_PARTNER", "LAWYER_MANAGER", "LAWYER"];
      if (!allowProjects.includes(role)) return deny();
    }

    if (pathname.startsWith("/admin/reports") && !REPORTS_ROLES.includes(role)) return deny();
    if (pathname.startsWith("/admin/tasks")) {
      const allowTasks = [...SUPER, "ADMIN", "LAWYER_PARTNER", "LAWYER_MANAGER", "LAWYER", "ACCOUNTANT_MASTER", "ACCOUNTANT_ASSISTANT"];
      if (!allowTasks.includes(role)) return deny();
    }
    if (pathname.startsWith("/admin/time")) {
      const allowAdminTime = [...SUPER, "ADMIN", "HR_MANAGER", "ACCOUNTANT_MASTER", "LAWYER_MANAGER"];
      if (!allowAdminTime.includes(role)) return deny();
    }
    if (pathname.startsWith("/admin/payroll")) {
      const allowPayroll = [...SUPER, "ACCOUNTANT_MASTER", "HR_MANAGER"];
      if (!allowPayroll.includes(role)) return deny();
    }
    if (pathname.startsWith("/admin/hr") && !HR_ALL.includes(role)) return deny();
    if (pathname.startsWith("/admin/employees") || pathname.startsWith("/admin/positions") || pathname.startsWith("/admin/penalties")) {
      const allowHrAdmin = [...SUPER, "HR_MANAGER", "HR"];
      if (!allowHrAdmin.includes(role)) return deny();
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/company") || pathname.startsWith("/admin/permissions")) {
      const allowSettings = [...SUPER, "ADMIN", "ACCOUNTANT_MASTER"];
      if (!allowSettings.includes(role)) return deny();
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
