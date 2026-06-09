import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getAuthServer } from "@/lib/auth";
import { getWebsiteCompanyId } from "./getWebsiteCompanyId";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  companyId?: number;
}

export async function verifyWebsiteAuth(req: NextRequest, allowedRoles = ["ADMIN", "OWNER", "MANAGING_PARTNER", "SUPER_ADMIN"]) {
  const token = getAuthServer(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (decoded && allowedRoles.includes(decoded.role)) {
      if (decoded.role === "SUPER_ADMIN" && !decoded.companyId) {
        decoded.companyId = await getWebsiteCompanyId();
      }
      return decoded;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}
