const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const websiteContent = {
  hero: {
    tagline: "We speak the language of law and business.",
    titleFirst: "STRATEGIC LEGAL",
    titleSecond: "SHIELD",
    subtitle: "Shield Advocates – Al Hawy & Hassane is a premier independent law firm based in the administrative heart of Sheikh Zayed City, Giza. Established in 2020, the firm provides bespoke legal solutions across corporate, commercial and intellectual property matters. Its multidisciplinary team combines deep legal experience with business‑savvy insight to navigate complex transactions, cross‑border arrangements and high‑value disputes. The firm works with multinational corporations, regional and local businesses, investors and entrepreneurs, helping them manage legal and compliance risks and protect their most valuable assets.",
    ctaBook: "Request Consultation",
    ctaPortal: "Client Workspace"
  },
  about: {
    tagline: "THE FIRM",
    title: "Protecting Corporate Integrity & Assets Since 2020",
    description1: "Shield Advocates is a full‑service law practice offering tailored solutions to multinational corporations, regional businesses and start‑ups. The firm’s mission is to be a trusted legal partner who helps clients identify and mitigate legal risks across industries and stages of growth. By pairing legal acumen with commercial awareness, the team guides clients through complex deals, cross‑border transactions and major disputes.",
    description2: "Our mission is to become the legal partner of choice for businesses operating in Egypt and the Middle East. We aim to deliver practical solutions that support decision‑making, ensure regulatory compliance and foster sustainable growth. Clients choose us because of our experienced advisers with commercial mindsets, our proactive risk‑focused approach, transparent communication and proven track record of local and international success. We help businesses build compliant corporate structures aligned with their strategic objectives.",
  },
  recognition: {
    awards: [
      {
        title: "The Legal 500",
        institution: "Leading Firm - Egypt",
        desc: "Ranked as a leading firm for intellectual property and corporate/commercial law in Egypt."
      },
      {
        title: "IP STARS",
        institution: "Recommended Firm",
        desc: "Recognised among the top firms for trademark and patent work and praised for anti‑counterfeiting initiatives."
      },
      {
        title: "MEA Business Awards",
        institution: "Winner - 2023",
        desc: "Winner of Best Intellectual Property & Commercial Law Firm in Egypt, 2023."
      },
      {
        title: "Influential Businesswoman Awards",
        institution: "Winner - 2026",
        desc: "Commended the firm’s leadership for contributions to women in the legal field."
      },
      {
        title: "Additional Honours",
        institution: "Shortlisted & Top Ranked",
        desc: "The firm has been shortlisted for “Firm of the Year” and ranked among the top ten firms for trademarks (2023–2025) and patents (2024–2025) in Egypt."
      }
    ]
  },
  practices: {
    list: [
      {
        id: "ip",
        title: "Intellectual Property & Brand Protection",
        shortDesc: "Trademark portfolio management, patent registration, copyright protection, and anti-counterfeiting raids.",
        longDesc: "Our IP department offers end‑to‑end protection for brands, inventions and creative works. Services include trademark searches, filings and renewals, patent prosecution, copyright registration and enforcing rights through customs actions, anti‑counterfeiting raids and litigation. We manage global portfolios, coordinate international filings through INTA networks, draft licensing and assignment agreements and handle renewals and recordals. The practice is consistently recognised by leading rankings such as Managing IP and has earned “Recommended Firm” status. The team serves clients across diverse industries and is led by award‑winning practitioners.\n\nOur Intellectual Property team covers the Middle East and North Africa, including North Africa (Algeria, Egypt, Libya, Morocco and Tunisia), the Levant (Iraq, Jordan, Lebanon and Syria) and the Gulf Cooperation Council (Saudi Arabia, UAE, Bahrain, Kuwait, Oman and Qatar). Through a network of trusted associates, we coordinate filings and enforcement actions across these jurisdictions.",
        icon: "ShieldAlert"
      },
      {
        id: "corporate",
        title: "Corporate & Commercial Law",
        shortDesc: "Structuring complex commercial contracts, joint ventures, governance, and regulatory licensing.",
        longDesc: "We provide comprehensive legal support for companies operating in Egypt and internationally. Our lawyers assist with company formation, joint ventures, shareholder agreements, corporate governance, franchising and regulatory licensing. For investors seeking to enter the Egyptian market, we offer fast and reliable incorporation services and guide cross‑border expansion through our global network.",
        icon: "Briefcase"
      },
      {
        id: "labor",
        title: "Labour & Employment Law",
        shortDesc: "Advising on Egyptian Labor Law No. 12 of 2003, executive policies, and labor disputes.",
        longDesc: "Our employment team advises clients on all aspects of Egyptian Labour Law No. 12 of 2003. We draft employment contracts, handbooks and executive policies; handle terminations, restructuring and profit‑sharing arrangements; and represent clients in labour disputes. Under our leadership, the employment practice has been recognised by The Legal 500 for strengthening the firm’s offering.",
        icon: "Users"
      },
      {
        id: "disputes",
        title: "Dispute Resolution & Arbitration",
        shortDesc: "Litigation before Cairo Economic Courts, civil/tax chambers, and international arbitration.",
        longDesc: "We represent clients in complex disputes before the Cairo Economic Courts, civil and tax chambers and international arbitral tribunals. Our litigation team leverages deep procedural knowledge to achieve favourable outcomes in commercial, contractual and regulatory disputes. With experience in high‑stakes litigation and cross‑border arbitration, we offer strategic guidance from pre‑litigation risk assessment through settlement or final award.",
        icon: "Scale"
      },
      {
        id: "ma",
        title: "Mergers & Acquisitions",
        shortDesc: "Legal due diligence, transaction structuring, and regulatory clearances.",
        longDesc: "We guide clients through every stage of the deal cycle, from legal due diligence and risk assessment to structuring, drafting and negotiating transaction documents. Our M&A team works closely with tax and regulatory specialists to ensure transactions comply with Egyptian law and obtain necessary governmental approvals. We have advised on acquisitions, disposals, joint ventures and corporate restructurings across diverse sectors.",
        icon: "TrendingUp"
      },
      {
        id: "finance",
        title: "Banking, Finance & Capital Markets",
        shortDesc: "Corporate credit structures, regulatory financial authority compliance, and project finance.",
        longDesc: "We advise banks, financial institutions and corporate borrowers on credit facilities, project finance, securitisation, Islamic finance and regulatory compliance. Our capital markets practice handles equity and debt offerings, private placements and continuing obligations on the Egyptian Exchange and abroad.",
        icon: "DollarSign"
      }
    ]
  },
  team: {
    members: [
      {
        name: "Assem Al Hawy",
        role: "Founding Partner & Head of Corporate",
        bio: "Assem Al Hawy co‑founded Shield Advocates in 2020 and leads the General Corporate and Commercial Department. Based in Giza, he has more than 20 years of experience guiding companies through complex corporate and commercial transactions. Assem drafts and negotiates distribution and agency agreements, manufacturing and supply contracts and other strategic arrangements. He specialises in corporate law with a focus on labour law, corporate governance, banking and finance, capital markets, M&A, real estate and dispute resolution. His background spans industries such as mining, pharmaceuticals, media, e‑commerce and finance; he has advised on large‑scale human resources restructurings, due diligence reviews and public and private free‑zone incorporations.",
        focus: ["Corporate Law", "Labour Law", "M&A", "Banking & Finance"],
        image: "/images/partner_assem.jpeg",
        video: "/video/assem.mp4"
      },
      {
        name: "Hassane El Sheref",
        role: "Founding Partner & Head of Intellectual Property",
        bio: "Hassane El Sheref is a top‑ranked IP practitioner with over a decade of experience protecting brands across the Middle East and North Africa. As the head of the firm’s Intellectual Property Department, he manages international trademark portfolios, coordinates anti‑counterfeiting raids, oversees patent prosecution and represents clients in infringement disputes. He was shortlisted for “IP Lawyer of the Year 2026,” serves as Co‑Chair of the International Trademark Association (INTA) Middle East Global Advisory Council and is regularly recognised by The Legal 500 and IP STARS.",
        focus: ["Brand Protection", "Trademark Litigation", "Customs Enforcement", "Anti-Counterfeiting"],
        image: "/images/partner_hassane.jpeg",
        video: "/video/hassan.mp4"
      },
      {
        name: "Omneya Moawad",
        role: "Managing Associate, Intellectual Property",
        bio: "Omneya Moawad is a highly praised senior legal advisor specialising in IP litigation, trademark opposition briefs and regulatory affairs. She adopts a strategic, detail‑oriented approach that has earned recognition from the 2026 Influential Businesswoman Awards. Omneya works closely with Hassane El Sheref to enforce IP rights and craft effective brand protection strategies. She is supported by a team of specialised attorneys, trademark agents, patent attorneys and investigators.",
        focus: ["IP Litigation", "Trademark Registrations", "Opposition Briefs", "Regulatory Affairs"],
        image: "/images/partner_omneya.jpeg",
        video: "/video/omneya.mp4"
      }
    ]
  },
  scheduler: {
    timeSlots: [
      "09:30 AM - 10:00 AM",
      "10:30 AM - 11:00 AM",
      "12:00 PM - 12:30 PM",
      "02:00 PM - 02:30 PM",
      "04:00 PM - 04:30 PM"
    ]
  },
  contact: {
    officeTitle: "Sheikh Zayed Office",
    address: "Unit 302Y, Administrative Building, Karma 1, 4th District, Sheikh Zayed City, Giza, Egypt",
    phone: "+2 (02) 3304 3010",
    email: "info@shieldadvocates.com",
    workingHours: "Sunday – Thursday, 9:00 AM – 5:30 PM (Egypt Time)",
  },
  chatbot: {
    faq: [
      { question: "Where is the Giza office?", answer: "We are located at Unit 302Y, Administrative Building, Karma 1, 4th District, Sheikh Zayed City, Giza, Egypt." },
      { question: "What is the contact number?", answer: "You can reach us at our official number: +2 (02) 3304 3010, or by emailing info@shieldadvocates.com." },
      { question: "Who leads the IP practice?", answer: "Our Intellectual Property and Brand Protection practice is led by Partner Hassane El Sheref, with Managing Associate Omneya Moawad supervising opposition briefs and registrations." },
      { question: "What awards do you have?", answer: "Shield Advocates has been recognized by The Legal 500 and IP Stars, and won the 2023 MEA Business Awards and 2026 Influential Businesswoman Awards." }
    ]
  }
};

const prisma = new PrismaClient();

async function seed() {
  // Find first company or create one
  let company = await prisma.company.findFirst();
  if (!company) {
    console.log("⚠️ No company found in the database. Creating default company 'Shield Advocates'...");
    company = await prisma.company.create({
      data: {
        name: "Shield Advocates",
        registeredEmail: "info@shieldadvocates.com",
        status: "ACTIVE",
        maxSeats: 10,
        subscriptionEnds: new Date("2030-01-01"),
      }
    });

    const hash = await bcrypt.hash("Letmein@NZ", 12);
    
    // Create admin user for this company
    await prisma.user.create({
      data: {
        name: "Shield Advocates Admin",
        email: "info@shieldadvocates.com",
        passwordHash: hash,
        role: "ADMIN",
        companyId: company.id,
      }
    });
    console.log("✅ Created default company and admin user (info@shieldadvocates.com / Letmein@NZ)");
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
  for (let i = 0; i < websiteContent.team.members.length; i++) {
    const member = websiteContent.team.members[i];
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
  for (let i = 0; i < websiteContent.practices.list.length; i++) {
    const practice = websiteContent.practices.list[i];
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
  for (let i = 0; i < websiteContent.recognition.awards.length; i++) {
    const award = websiteContent.recognition.awards[i];
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
  for (let i = 0; i < websiteContent.chatbot.faq.length; i++) {
    const faq = websiteContent.chatbot.faq[i];
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
  for (let i = 0; i < websiteContent.scheduler.timeSlots.length; i++) {
    const slot = websiteContent.scheduler.timeSlots[i];
    await prisma.websiteScheduleSlot.create({
      data: {
        companyId: COMPANY_ID,
        label: slot,
        sortOrder: i,
      }
    });
  }

  // 9. Seed Case Tracker Demo Data
  let client = await prisma.client.findFirst({ where: { companyId: COMPANY_ID, contactEmail: "client@globaltech.com" } });
  if (!client) {
    const adminUser = await prisma.user.findFirst({ where: { companyId: COMPANY_ID } });
    if (adminUser) {
      client = await prisma.client.create({
        data: {
          companyId: COMPANY_ID,
          ownerId: adminUser.id,
          name: "Global Tech Solutions Inc.",
          contactEmail: "client@globaltech.com",
          contactPerson: "John Doe",
          code: "C0001",
        }
      });
      console.log("✅ Seeded demo client 'Global Tech Solutions Inc.'");
    }
  }

  if (client) {
    let project = await prisma.project.findFirst({ where: { companyId: COMPANY_ID, code: "SA-IP-2026-092" } });
    if (!project) {
      const adminUser = await prisma.user.findFirst({ where: { companyId: COMPANY_ID } });
      project = await prisma.project.create({
        data: {
          companyId: COMPANY_ID,
          ownerId: adminUser.id,
          clientId: client.id,
          name: "Intellectual Property Opposition & Trademark Litigation",
          code: "SA-IP-2026-092",
          status: "OPEN",
        }
      });
      console.log("✅ Seeded demo project 'SA-IP-2026-092'");

      // Seed milestones (Tasks)
      const milestones = [
        { title: "Case Assessment & Power of Attorney Verified", daysOffset: -69, status: "DONE" },
        { title: "Cease & Desist Warning Served to Counterparty", daysOffset: -53, status: "DONE" },
        { title: "Opposition Brief Lodged at Egypt Trademark Registry", daysOffset: -36, status: "DONE" },
        { title: "First economic court trial hearing held in Giza", daysOffset: -9, status: "DONE" },
        { title: "Submission of Written Defense & Evidence Logs", daysOffset: -2, status: "DONE" },
        { title: "Final Court Verdict and Execution of Seizures", daysOffset: 32, status: "PENDING" }
      ];

      for (const m of milestones) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + m.daysOffset);
        await prisma.task.create({
          data: {
            title: m.title,
            dueDate,
            status: m.status,
            assignerId: adminUser.id,
            projectId: project.id,
            assigneeIds: String(adminUser.id),
          }
        });
      }
      console.log("✅ Seeded demo project milestones");

      // Seed project attachments (documents)
      const attachments = [
        { label: "Trademark_Infringement_Claim_Brief.pdf", url: "/documents/Trademark_Infringement_Claim_Brief.pdf" },
        { label: "Notarized_Power_of_Attorney_GAFI.pdf", url: "/documents/Notarized_Power_of_Attorney_GAFI.pdf" },
        { label: "Giza_Economic_Court_First_Hearing_Minutes.pdf", url: "/documents/Giza_Economic_Court_First_Hearing_Minutes.pdf" }
      ];

      for (const att of attachments) {
        await prisma.projectAttachment.create({
          data: {
            projectId: project.id,
            label: att.label,
            url: att.url,
            uploadedById: adminUser.id,
          }
        });
      }
      console.log("✅ Seeded demo project attachments");

      // Also create project assignment for Assem and Hassane in case
      await prisma.projectAssignment.create({
        data: {
          userId: adminUser.id,
          projectId: project.id,
        }
      });
    }
  }

  console.log("✅ Website content & portal demo seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
