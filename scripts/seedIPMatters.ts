import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
  if (!user) throw new Error("No user found");

  const matters = [
    {
      country: 'EG',
      trademark: 'AURIUM',
      applicationNumber: 'N/A',
      applicationDate: '2026-03-03',
      niceClasses: '35',
      trademarkStatus: 'Under Examination',
      applicantName: 'AURIUM Ltd'
    },
    {
      country: 'SA',
      trademark: 'AURIUM',
      applicationNumber: 'SA - 1226214',
      applicationDate: '2026-04-02',
      niceClasses: '36',
      trademarkStatus: 'Published',
      applicantName: 'EFG Holding'
    },
    {
      country: 'TR',
      trademark: 'AURIUM',
      applicationNumber: '2026/033002',
      applicationDate: '2026-03-13',
      niceClasses: '36',
      trademarkStatus: 'Under examination',
      applicantName: 'AURIUM Ltd'
    },
    {
      country: 'CH',
      trademark: 'AURIUM',
      applicationNumber: '03697/2026',
      applicationDate: '2026-03-02',
      niceClasses: '9',
      trademarkStatus: 'Under examination',
      applicantName: 'AURIUM Ltd'
    },
    {
      country: 'CH',
      trademark: 'AURIUM',
      applicationNumber: '03698/2026',
      applicationDate: '2026-03-02',
      niceClasses: '35',
      trademarkStatus: 'Under examination',
      applicantName: 'AURIUM Ltd'
    },
    {
      country: 'CH',
      trademark: 'AURIUM',
      applicationNumber: '03699/2026',
      applicationDate: '2026-03-02',
      niceClasses: '36',
      trademarkStatus: 'Under examination',
      applicantName: 'AURIUM Ltd'
    }
  ];

  for (const m of matters) {
    await prisma.task.create({
      data: {
        title: `${m.trademark} - ${m.country} - Class ${m.niceClasses}`,
        taskType: 'IP',
        ipType: 'TRADEMARK',
        ipAction: 'Application filing',
        assignerId: user.id,
        assigneeIds: String(user.id),
        dueDate: new Date(),
        actionDetails: {
          countryJurisdiction: m.country,
          trademark: m.trademark,
          applicationNumber: m.applicationNumber,
          applicationDate: m.applicationDate,
          niceClasses: m.niceClasses,
          trademarkStatus: m.trademarkStatus,
          applicantName: m.applicantName
        }
      }
    });
  }
  console.log("Successfully inserted " + matters.length + " matters.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
