export const websiteContent = {
  metadata: {
    title: "Shield Advocates | Al Hawy & Hassane | Corporate & IP Law Firm",
    description: "Shield Advocates - Al Hawy & Hassane is an elite full-service corporate and intellectual property law firm based in Sheikh Zayed, Giza, Egypt. Top ranked by The Legal 500 and IP STARS.",
  },
  
  navigation: {
    logo: "SHIELD ADVOCATES",
    subLogo: "AL HAWY & HASSANE",
    links: [
      { name: "Home", href: "#home" },
      { name: "About us", href: "#about" },
      { name: "Expertise", href: "#practices" },
      { name: "Recognition", href: "#recognition" },
      { name: "Our Team", href: "#team" },
      { name: "Case Tracker", href: "#portal-demo" },
      { name: "Contact", href: "#contact" }
    ],
    cta: "Portal Access",
    ctaHref: "/login"
  },

  hero: {
    tagline: "TOP-RANKED LAW FIRM | SHEIKH ZAYED, EGYPT",
    titleFirst: "STRATEGIC LEGAL",
    titleSecond: "SHIELD",
    subtitle: "Shield Advocates - Al Hawy & Hassane is a premier independent corporate and intellectual property law firm. Trusted by multinational corporations and global brands to protect assets and navigate complex regulatory frameworks in Egypt and the MENA region.",
    ctaBook: "Request Consultation",
    ctaPortal: "Client Workspace"
  },

  about: {
    tagline: "THE FIRM",
    title: "Protecting Corporate Integrity & Assets Since 2020",
    description1: "Founded in 2020, Shield Advocates – Al Hawy & Hassane is a premium full-service law firm based in the administrative heart of Sheikh Zayed City, Giza. We bridge local Egyptian legal complexities with international corporate standards.",
    description2: "We are highly recognized by leading global legal rating directories such as The Legal 500 and IP STARS for our exceptional legal advocacy, corporate structuring capabilities, and comprehensive intellectual property enforcement campaigns.",
    stats: [
      { value: "2020", label: "Established in Giza, Egypt" },
      { value: "Legal 500", label: "Top-Ranked Practice" },
      { value: "20+", label: "Years Lead Partner Experience" },
      { value: "100%", label: "Business-Oriented Transparency" }
    ]
  },

  recognition: {
    tagline: "ACCOLADES & PARTNERSHIPS",
    title: "Globally Rated & Awarded Excellence",
    subtitle: "Our firm is consistently recognized by international rating agencies and award bodies for our legal achievements and client service transparency.",
    awards: [
      {
        title: "The Legal 500",
        institution: "Leading Firm - Egypt",
        desc: "Ranked as a top-tier firm for Intellectual Property and Corporate/Commercial legal representation in Egypt."
      },
      {
        title: "IP STARS",
        institution: "Trademark & Patent Authority",
        desc: "Highly recommended for trademark strategy, registration, customs enforcement, and anti-counterfeiting raids."
      },
      {
        title: "MEA Business Awards",
        institution: "Winner - 2023",
        desc: "Awarded Best Corporate & Intellectual Property Law Firm in Egypt for outstanding commercial legal advice."
      },
      {
        title: "Influential Businesswoman Awards",
        institution: "Winner - 2026",
        desc: "Recognizing outstanding leadership and legal execution by our managing associates."
      }
    ]
  },

  practices: {
    tagline: "PRACTICE AREAS",
    title: "Corporate Governance & Brand Protection",
    subtitle: "We deliver practical, solution-oriented legal advice across a wide spectrum of corporate, intellectual property, and transactional disciplines.",
    list: [
      {
        id: "ip",
        title: "Intellectual Property & Brand Protection",
        shortDesc: "Trademark portfolio management, patent registration, copyright protection, and anti-counterfeiting raids.",
        longDesc: "Led by Partner Hassane El Sheref, our Intellectual Property department is a core strength. We coordinate directly with Egyptian customs and security authorities to conduct customs seizures and raids, protecting global luxury and commercial brands from counterfeiting.",
        icon: "ShieldAlert"
      },
      {
        id: "corporate",
        title: "Corporate & Commercial Law",
        shortDesc: "Structuring complex commercial contracts, joint ventures, governance, and regulatory licensing.",
        longDesc: "We assist multinational enterprises and investors with drafting joint venture agreements, distribution agreements, franchising, agency licensing, and ensuring compliance with the General Authority for Investment (GAFI).",
        icon: "Briefcase"
      },
      {
        id: "labor",
        title: "Labour & Employment Law",
        shortDesc: "Advising on Egyptian Labor Law No. 12 of 2003, executive policies, and labor disputes.",
        longDesc: "Under Founding Partner Assem Al Hawy, we provide comprehensive advice on drafting employment agreements, structuring social security compliance, collective bargaining, and representing management in labor union disputes.",
        icon: "Users"
      },
      {
        id: "disputes",
        title: "Dispute Resolution & Arbitration",
        shortDesc: "Litigation before Cairo Economic Courts, civil/tax chambers, and international arbitration.",
        longDesc: "We protect our clients' commercial interests in litigation before Egyptian courts and in alternative dispute resolution (ADR). We represent corporations in high-stakes international arbitration proceedings.",
        icon: "Scale"
      },
      {
        id: "ma",
        title: "Mergers & Acquisitions (M&A)",
        shortDesc: "Legal due diligence, transaction structuring, and regulatory clearances.",
        longDesc: "We guide corporate expansions by executing comprehensive legal due diligence, drafting share purchase agreements (SPAs), shareholder agreements, and obtaining antitrust clearances from the Egyptian Competition Authority.",
        icon: "TrendingUp"
      },
      {
        id: "finance",
        title: "Banking, Finance & Capital Markets",
        shortDesc: "Corporate credit structures, regulatory financial authority compliance, and project finance.",
        longDesc: "We advise financial entities and corporate borrowers on structuring secured loan agreements, project financing, and compliance with the Central Bank of Egypt (CBE) and Financial Regulatory Authority (FRA) guidelines.",
        icon: "DollarSign"
      }
    ]
  },

  team: {
    tagline: "OUR LEADERSHIP",
    title: "Expert Legal Counsellors",
    subtitle: "Every matter is directly supervised by our founding partners, ensuring strategic depth and executive diligence.",
    members: [
      {
        name: "Assem Al Hawy",
        role: "Founding Partner & Head of Corporate",
        bio: "Assem Al Hawy has over 20 years of experience leading major corporate transactions in Egypt. He is a recognized authority in corporate restructuring, joint ventures, and Egyptian labor law, advising major multinational manufacturing and commercial firms.",
        focus: ["Corporate Law", "Labour & Employment", "Commercial Contracts", "GAFI Compliance"],
        image: "/images/partner_assem.png"
      },
      {
        name: "Hassane El Sheref",
        role: "Founding Partner & Head of Intellectual Property",
        bio: "Hassane El Sheref is a top-ranked IP Stars practitioner with extensive expertise in cross-border brand protection. He manages international trademark portfolios and executes anti-counterfeiting raids. He is active in the International Trademark Association (INTA).",
        focus: ["Brand Protection", "Trademark Litigation", "Customs Enforcement", "Anti-Counterfeiting"],
        image: "/images/partner_hassane.png"
      },
      {
        name: "Omneya Moawad",
        role: "Managing Associate - Intellectual Property",
        bio: "Omneya Moawad is a highly praised senior legal advisor specializing in IP litigation, trademark opposition briefs, and regulatory affairs. She is recognized for her strategic approach in complex trademark disputes and was highlighted in the 2026 Influential Businesswoman Awards.",
        focus: ["IP Litigation", "Trademark Registrations", "Opposition Briefs", "Regulatory Affairs"],
        image: "/images/partner_omneya.png"
      }
    ]
  },

  portalDemo: {
    title: "ProLaw Client Portal Preview",
    subtitle: "Track active milestones, review pleadings, and view court schedules. This live interactive workspace demonstrates how Shield Advocates utilizes state-of-the-art legal tech to deliver transparency to our corporate partners.",
    clientName: "Global Tech Solutions Inc.",
    matterName: "Intellectual Property Opposition & Trademark Litigation",
    caseNumber: "SA-IP-2026-092",
    courtName: "Cairo Economic Court, Giza Chamber",
    currentStatus: "Pleadings Submitted - Awaiting Court Verdict",
    assignedAttorneys: ["Hassane El Sheref", "Omneya Moawad"],
    milestones: [
      { title: "Case Assessment & Power of Attorney Verified", date: "April 02, 2026", status: "completed" },
      { title: "Cease & Desist Warning Served to Counterparty", date: "April 18, 2026", status: "completed" },
      { title: "Opposition Brief Lodged at Egypt Trademark Registry", date: "May 05, 2026", status: "completed" },
      { title: "First economic court trial hearing held in Giza", date: "June 01, 2026", status: "completed" },
      { title: "Submission of Written Defense & Evidence Logs", date: "June 08, 2026 (Today)", status: "completed" },
      { title: "Final Court Verdict and Execution of Seizures", date: "Scheduled for July 12, 2026", status: "upcoming" }
    ],
    documents: [
      { name: "Trademark_Infringement_Claim_Brief.pdf", size: "1.4 MB", type: "PDF", date: "May 04, 2026" },
      { name: "Notarized_Power_of_Attorney_GAFI.pdf", size: "920 KB", type: "PDF", date: "April 10, 2026" },
      { name: "Giza_Economic_Court_First_Hearing_Minutes.pdf", size: "380 KB", type: "PDF", date: "June 02, 2026" }
    ]
  },

  scheduler: {
    title: "Schedule Consultation",
    subtitle: "Book a direct consultation with our legal partners. Choose your practice area, select an available date, and provide details of your corporate legal inquiry.",
    form: {
      name: "Your Name",
      email: "Corporate Email",
      company: "Company Name",
      phone: "Phone Number",
      summary: "Case Summary / Legal Inquiry Description",
      practice: "Select Practice Area",
      date: "Select Date",
      time: "Select Time Slot",
      btn: "Confirm Consultation Request",
      successTitle: "Consultation Successfully Requested",
      successDesc: "Thank you for reaching out to Shield Advocates. A calendar invite and conference access details have been sent to your corporate email."
    },
    timeSlots: [
      "09:30 AM - 10:00 AM",
      "10:30 AM - 11:00 AM",
      "12:00 PM - 12:30 PM",
      "02:00 PM - 02:30 PM",
      "04:00 PM - 04:30 PM"
    ]
  },

  contact: {
    title: "Our Offices",
    subtitle: "Contact our partners directly or visit our Giza administrative office to discuss corporate agreements.",
    officeTitle: "Sheikh Zayed Office",
    address: "Karma 1, Administrative Building, 4th District, Sheikh Zayed City, Giza, Egypt",
    phone: "+20 1027 6000 78",
    email: "info@shieldadvocates.com",
    workingHours: "Sunday - Thursday: 9:00 AM - 5:30 PM (Egypt Time)",
    form: {
      title: "Direct Inquiry",
      btn: "Submit Inquiry",
      success: "Thank you. Your inquiry has been routed to our managing associate. We will respond within 24 hours."
    }
  },

  chatbot: {
    welcome: "Welcome to Shield Advocates. I am your AI assistant. I can guide you through our practice areas, tell you about our office location, or help you schedule a consultation. How can I help you?",
    placeholder: "Type a question...",
    faq: [
      { question: "Where is the Giza office?", answer: "We are located at Karma 1, Administrative Building, 4th District, Sheikh Zayed City, Giza, Egypt." },
      { question: "What is the contact number?", answer: "You can reach us at our official mobile number: +20 1027 6000 78, or by emailing info@shieldadvocates.com." },
      { question: "Who leads the IP practice?", answer: "Our Intellectual Property and Brand Protection practice is led by Partner Hassane El Sheref, with Managing Associate Omneya Moawad supervising opposition briefs and registrations." },
      { question: "What awards do you have?", answer: "Shield Advocates has been recognized by The Legal 500 and IP Stars, and won the 2023 MEA Business Awards and 2026 Influential Businesswoman Awards." }
    ]
  },

  footer: {
    legalNotice: "© 2026 Shield Advocates - Al Hawy & Hassane. All rights reserved. Top-tier Legal Representation in Egypt & MENA. The content on this website does not constitute formal legal advice."
  }
};
