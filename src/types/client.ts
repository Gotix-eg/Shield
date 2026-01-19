export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  vatCode?: string;
  code?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSelectOption {
  value: string;
  label: string;
}
