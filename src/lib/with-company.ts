import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { runWithCompanyId } from './tenant-context';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;
const getSecret = () => {
  if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production.');
  }
  return JWT_SECRET || "dev-only-unsafe-secret";
};

export function withCompany<T>(handler: (req: NextRequest, context: { companyId?: number; userId?: number; role?: string }) => Promise<T>) {
  return async function wrapped(req: NextRequest): Promise<T> {
    // Extract token from Authorization header or cookie
    let token = req.headers.get('authorization') || '';
    if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
    if (!token) {
      // Try cookie
      const cookie = req.cookies.get('token');
      token = cookie?.value || '';
    }
    
    let companyId: number | undefined;
    let userId: number | undefined;
    let role: string | undefined;
    
    if (token) {
      try {
        const secret = getSecret();
        // MANDATORY: Only trust tokens verified with JWT_SECRET
        const payload = jwt.verify(token, secret) as { companyId?: number; sub?: string; id?: number; role?: string };
        companyId = payload.companyId;
        role = payload.role;
        
        const claim = payload.sub ?? (payload as any).id;
        userId = claim ? parseInt(String(claim), 10) : undefined;

        if (!companyId && userId && !Number.isNaN(userId)) {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true, role: true } });
          companyId = user?.companyId;
          if (!role) role = user?.role;
        }
      } catch (error) {
        // Token verification failed (invalid secret, expired, or forged)
        console.error('withCompany: JWT verification failed', error);
        companyId = undefined;
        userId = undefined;
        role = undefined;
      }
    }

    return runWithCompanyId(companyId, () => handler(req, { companyId, userId, role }));
  };
}
