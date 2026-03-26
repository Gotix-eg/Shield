import { PrismaClient, Prisma } from "@prisma/client";
import { getCompanyId } from "./tenant-context";

// Ensure Decimal values are serialized as strings to avoid floating point rounding issues
if (!(Prisma as any).Decimal.prototype.toJSON) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call */
  (Prisma as any).Decimal.prototype.toJSON = function () {
    return this.toString();
  };
  /* eslint-enable */
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ["error"],
  });

  // Multi-tenant isolation middleware: scope every query by companyId stored in AsyncLocalStorage
  client.$use(async (params, next) => {
    const companyId = getCompanyId();
    if (!companyId) {
      return next(params);
    }

    const readActions = ["findMany", "findFirst", "aggregate", "count"];
    if (readActions.includes(params.action)) {
      params.args = params.args || {};
      params.args.where = { ...(params.args.where ?? {}), companyId };
    }
    
    // findUnique is tricky - it only accepts unique fields. 
    // If we want to enforce companyId on findUnique, we'd need compound unique keys in schema.
    // For now, let's convert findUnique to findFirst if companyId is present
    if (params.action === "findUnique") {
      params.action = "findFirst";
      params.args = params.args || {};
      params.args.where = { ...(params.args.where ?? {}), companyId };
    }

    if (params.action === "create" || params.action === "createMany") {
      params.args = params.args || {};
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((d: any) => ({ ...d, companyId }));
      } else {
        params.args.data = { ...params.args.data, companyId };
      }
    }

    if (["update", "updateMany", "delete", "deleteMany"].includes(params.action)) {
      params.args = params.args || {};
      params.args.where = { ...(params.args.where ?? {}), companyId };
    }
    
    if (params.action === "upsert") {
      params.args = params.args || {};
      params.args.where = { ...(params.args.where ?? {}), companyId };
      params.args.create = { ...(params.args.create ?? {}), companyId };
      params.args.update = { ...(params.args.update ?? {}), companyId };
    }

    return next(params);
  });

  return client;
};

// Prevent creating multiple instances in development hot-reload
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


export default prisma;
