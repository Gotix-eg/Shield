import { prisma } from "@/lib/db";

export async function getWebsiteCompanyId(): Promise<number> {
  const company = await prisma.company.findFirst();
  return company?.id || 1;
}
