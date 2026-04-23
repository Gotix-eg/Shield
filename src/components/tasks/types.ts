export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  dueDate: string;
  taskType?: string;
  ipType?: string;
  ipAction?: string;
  actionDetails?: Record<string, any>;
  isAgent: boolean;
  agent?: { id: number; name: string } | null;
  agentId?: number;
  defendantName?: string;
  opponent?: string;
  court?: string;
  client?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  assignees: { id: number; name: string }[];
  createdAt?: string;
  // Litigation fields
  litigationCategory?: string;
  litigationType?: string;
  caseType?: string;
  parties?: { plaintiff?: string; defendant?: string; agents?: string[] };
  courtAuthority?: string;
  caseNumber?: string;
  importantDates?: { label: string; date: string }[];
  filings?: { title: string; date: string; fileUrl?: string }[];
  hearingDate?: string;
  hearingRemarks?: string;
  nextHearingDate?: string;
  nextHearingRemarks?: string;
  reminderDate?: string;
  reminderSent?: boolean;
  decisions?: { date: string; summary: string }[];
  appeals?: { date: string; type: string; status: string }[];
  enforcement?: { status: string; details: string };
}

export type TaskCategory = 'landing' | 'GENERAL' | 'CORPORATE' | 'LITIGATION' | 'IP';
export type LitigationStep = 'choose' | 'form';

export interface SelectOption {
  id: number;
  name: string;
  clientId?: number;
}

export const LITIGATION_CATEGORIES = [
  { value: 'IP_LITIGATION', label: 'IP Litigation' },
  { value: 'CORPORATE_LITIGATION', label: 'Corporate Litigation' },
] as const;

export const LITIGATION_TYPES = [
  { value: 'CIVIL_COMMERCIAL', label: 'Civil / Commercial Litigation' },
  { value: 'ADMINISTRATIVE', label: 'Administrative Litigation' },
  { value: 'CRIMINAL', label: 'Criminal Litigation' },
  { value: 'ARBITRATION', label: 'Arbitration' },
] as const;

export const LITIGATION_TABS = [
  'Case Type', 'Parties', 'Court / Authority', 'Case Number',
  'Important Dates', 'Filings', 'Hearings', 'Next Hearing & Reminder',
  'Decisions', 'Appeals', 'Enforcement', 'Documents'
] as const;

export const IP_TYPES = ["TRADEMARK", "PATENT", "INDUSTRIAL_DESIGN", "PLANT_VARIETY", "COPYRIGHT", "SOFTWARE", "ENFORCEMENT"] as const;

export const IP_ACTIONS_BY_TYPE: Record<string, string[]> = {
  TRADEMARK: [
    "Trademark search", "Clearance opinion", "Application preparation",
    "Application filing", "Office action response", "Publication monitoring",
    "Opposition filing", "Opposition defense", "Registration",
    "Renewal", "Recordal (assignment / license / change)",
    "Coexistence agreement", "Trademark watch", "Infringement review",
    "Cease & desist", "Customs recordal", "Cancellation / petition", "Appeal (before the trademark office)"
  ],
  PATENT: [
    "Patentability search", "Prior art search", "Patent drafting",
    "Application preparation", "Application filing", "Formal examination response",
    "Substantive examination response", "Amendment filing", "Grant processing",
    "Validation (for regional patents)", "Annuity / maintenance fee payment",
    "Recordal (assignment / license)", "Patent watch",
    "Freedom-to-operate analysis", "Patent infringement analysis",
    "Patent opposition", "Revocation action", "Appeal"
  ],
  INDUSTRIAL_DESIGN: [
    "Design search", "Filing preparation", "Application filing",
    "Office action response", "Publication monitoring", "Registration processing",
    "Renewal", "Recordal", "Design watch", "Infringement assessment"
  ],
  PLANT_VARIETY: [
    "Plant variety search", "Application preparation", "Filing application",
    "Office action response", "Grant processing", "Renewal", "Recordal"
  ],
  COPYRIGHT: [
    "Copyright advisory", "Copyright registration",
    "Recordal (assignment / license)", "Copyright notice / documentation",
    "Infringement assessment (CR)", "Takedown request"
  ],
  SOFTWARE: [
    "Software search", "Clearance opinion", "Application preparation",
    "Application filing", "Office action response", "Registration processing",
    "Renewal", "Recordal", "Infringement analysis"
  ],
  ENFORCEMENT: [
    "Investigation request", "Evidence collection", "Market investigation",
    "Online monitoring", "Test purchase", "Infringement analysis",
    "Cease & desist", "Settlement negotiation", "Complaint"
  ]
};
