import { PrismaClient } from "@prisma/client";
import { websiteContent } from "../data/websiteContent";

const prisma = new PrismaClient();

async function seed() {
  // Find first company or fallback to 1
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("⚠️ No company found in the database. Please register a company first!");
    return;
  }
  const COMPANY_ID = company.id;
  console.log(`Using Company ID: ${COMPANY_ID} (${company.name})`);

  // Clear existing CMS records to avoid duplication on re-run
  await prisma.websiteHero.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteAbout.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteTeamMember.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websitePractice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteAward.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteContact.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteFaq.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.websiteScheduleSlot.deleteMany({ where: { companyId: COMPANY_ID } });

  // 1. Seed Hero
  await prisma.websiteHero.create({
    data: {
      companyId: COMPANY_ID,
      tagline: websiteContent.hero.tagline,
      titleFirst: websiteContent.hero.titleFirst,
      titleSecond: websiteContent.hero.titleSecond,
      subtitle: websiteContent.hero.subtitle,
      ctaBook: websiteContent.hero.ctaBook,
      ctaPortal: websiteContent.hero.ctaPortal,
    }
  });

  // 2. Seed About
  await prisma.websiteAbout.create({
    data: {
      companyId: COMPANY_ID,
      tagline: websiteContent.about.tagline,
      title: websiteContent.about.title,
      description1: websiteContent.about.description1,
      description2: websiteContent.about.description2,
    }
  });

  // 3. Seed Team Members
  for (const [i, member] of websiteContent.team.members.entries()) {
    await prisma.websiteTeamMember.create({
      data: {
        companyId: COMPANY_ID,
        name: member.name,
        role: member.role,
        bio: member.bio,
        focus: member.focus,
        imageUrl: member.image,
        videoUrl: member.video || null,
        sortOrder: i,
      }
    });
  }

  // 4. Seed Practices
  for (const [i, practice] of websiteContent.practices.list.entries()) {
    await prisma.websitePractice.create({
      data: {
        companyId: COMPANY_ID,
        slug: practice.id,
        title: practice.title,
        shortDesc: practice.shortDesc,
        longDesc: practice.longDesc,
        icon: practice.icon,
        sortOrder: i,
      }
    });
  }

  // 5. Seed Awards
  for (const [i, award] of websiteContent.recognition.awards.entries()) {
    await prisma.websiteAward.create({
      data: {
        companyId: COMPANY_ID,
        title: award.title,
        institution: award.institution,
        description: award.desc,
        sortOrder: i,
      }
    });
  }

  // 6. Seed Contact Info
  await prisma.websiteContact.create({
    data: {
      companyId: COMPANY_ID,
      officeTitle: websiteContent.contact.officeTitle,
      address: websiteContent.contact.address,
      phone: websiteContent.contact.phone,
      email: websiteContent.contact.email,
      workingHours: websiteContent.contact.workingHours,
    }
  });

  // 7. Seed FAQ
  for (const [i, faq] of websiteContent.chatbot.faq.entries()) {
    await prisma.websiteFaq.create({
      data: {
        companyId: COMPANY_ID,
        question: faq.question,
        answer: faq.answer,
        sortOrder: i,
      }
    });
  }

  // 8. Seed Schedule Slots
  for (const [i, slot] of websiteContent.scheduler.timeSlots.entries()) {
    await prisma.websiteScheduleSlot.create({
      data: {
        companyId: COMPANY_ID,
        label: slot,
        sortOrder: i,
      }
    });
  }

  console.log("✅ Website content seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
