'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { formatMoney } from '@/lib/i18n';
import { ClientSelectOption, Client } from '@/types/client';
import { ProjectSelectOption, Project } from '@/types/project';
import { Toaster, toast } from 'react-hot-toast';
import { getAuth } from '@/lib/auth';

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matterIdFromUrl = searchParams.get('matterId');
  const [loading, setLoading] = useState(false);

  // Initial form state
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    client: null,
    project: null,
    matterId: '',
    issueDate: '',
    dueDate: '',
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    discount: 0, // percentage
    tax: 0,
    total: 0,
    language: 'EN',
    currency: 'USD'
  });

  const [matter, setMatter] = useState<any>(null);
  const [clients, setClients] = useState<ClientSelectOption[]>([]);
  const [projects, setProjects] = useState<ProjectSelectOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');

  const handleChange = (field: keyof Invoice, value: any) => {
    setInvoice(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'discount' || field === 'tax') {
        const { sub, tot } = recalcTotals(
          updated.items as InvoiceItem[],
          field === 'discount' ? Number(value) || 0 : updated.discount || 0,
          field === 'tax' ? Number(value) || 0 : updated.tax || 0
        );
        updated.subtotal = sub;
        updated.total = tot;
      }
      return updated;
    });
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = getAuth();
        if (!token) return;
        const res = await fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setClients(data.map((client: Client) => ({ value: String(client.id), label: client.name })));
        }
      } catch (error) { console.error(error); }
    };

    const fetchProjects = async () => {
      try {
        const token = getAuth();
        if (!token) return;
        const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.map((project: Project) => ({ value: String(project.id), label: project.name, clientId: String(project.clientId) })));
        }
      } catch (error) { console.error(error); }
    };

    fetchClients();
    fetchProjects();

    if (matterIdFromUrl) {
      const fetchMatter = async () => {
        try {
          const token = getAuth();
          const res = await fetch(`/api/tasks/${matterIdFromUrl}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const m = await res.json();
            setMatter(m);
            setInvoice(prev => ({
              ...prev,
              clientId: String(m.clientId),
              projectId: m.projectId ? String(m.projectId) : '',
              matterId: String(m.id),
              currency: m.billingCurrency || prev.currency,
            }));
            setSelectedClient(String(m.clientId));
            if (m.projectId) setSelectedProject(String(m.projectId));
            
            if (m.billingType === 'FIXED' && m.retainerFee) {
              setInvoice(prev => ({
                ...prev,
                items: [{
                  id: Date.now(),
                  description: `${m.title} - Fixed Fee`,
                  quantity: 1,
                  unitPrice: parseFloat(m.retainerFee),
                  lineTotal: parseFloat(m.retainerFee)
                }]
              }));
            }
          }
        } catch (e) { console.error(e); }
      };
      fetchMatter();
    }
  }, [matterIdFromUrl]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
    setInvoice(prev => ({ ...prev, clientId, project: null, projectId: '' }));
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setInvoice(prev => ({ ...prev, projectId }));
  };

  const filteredProjects = projects.filter(project => !selectedClient || project.clientId === selectedClient);

  useEffect(() => {
    const { sub, tot } = recalcTotals(invoice.items as any, invoice.discount || 0, invoice.tax || 0);
    if (invoice.subtotal !== sub || invoice.total !== tot) {
      setInvoice(prev => ({ ...prev, subtotal: sub, total: tot }));
    }
  }, [invoice.discount, invoice.tax, invoice.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!invoice.invoiceNumber || !invoice.clientId || !invoice.issueDate) {
        throw new Error('Please fill in all required fields');
      }
      const invoiceData = {
        ...invoice,
        clientId: parseInt(invoice.clientId as string),
        projectId: invoice.projectId ? parseInt(invoice.projectId) : null,
        matterId: invoice.matterId ? parseInt(invoice.matterId) : null,
      };
      const token = getAuth();
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(invoiceData)
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      toast.success('Invoice created successfully');
      router.push('/invoices');
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now(), itemType: 'CUSTOM', description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]
    }));
  };

  const handleRemoveItem = (id: number) => {
    setInvoice(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== id) }));
  };

  const recalcTotals = (items: InvoiceItem[] = [], discPercent: number = 0, tx: number = 0) => {
    const sub = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    const discountAmt = sub * (discPercent / 100);
    const tot = sub - discountAmt + tx;
    return { sub, tot };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
      const newItems = (prev.items || []).map((item, i) => {
        const updated = i === index ? { ...item, [field]: value } : item;
        updated.lineTotal = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        return updated;
      });
      const { sub, tot } = recalcTotals(newItems, prev.discount || 0, prev.tax || 0);
      return { ...prev, items: newItems, subtotal: sub, total: tot };
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <button onClick={() => router.push('/dashboard/invoices')} className="text-blue-600 underline text-sm">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="font-semibold mb-4">Client and Project</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
              <select value={selectedClient} onChange={(e) => handleClientSelect(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select a client...</option>
                {clients.map(client => <option key={client.value} value={client.value}>{client.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
              <select value={selectedProject} onChange={(e) => handleProjectSelect(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="">Select a project...</option>
                {filteredProjects.map(project => <option key={project.value} value={project.value}>{project.label}</option>)}
              </select>
            </div>
          </div>
          {matter && (
            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
              <p className="text-sm font-medium text-amber-600">Generating Invoice for Matter:</p>
              <p className="text-sm text-slate-600">{matter.title}</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-4">Localization</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Language</label>
              <select value={invoice.language} onChange={(e)=>handleChange('language' as any, e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="EN">English</option>
                <option value="AR">العربية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={invoice.currency} onChange={(e)=>handleChange('currency' as any, e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="USD">USD $</option>
                <option value="EGP">EGP ج.م</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Invoice Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input type="text" value={invoice.invoiceNumber} onChange={(e) => handleChange('invoiceNumber', e.target.value)} className="w-full px-3 py-2 border rounded-md" required placeholder="INV-YYYY-MM-XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" value={invoice.issueDate} onChange={(e) => handleChange('issueDate', e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={invoice.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Invoice Items</h2>
          <div className="space-y-4">
            {(invoice.items || []).map((item, index) => (
              <div key={item.id} className="grid grid-cols-4 gap-4 border p-4 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div className="flex items-end"><button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-600 hover:text-red-800">Remove</button></div>
              </div>
            ))}
            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Item</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
            <input type="number" value={invoice.discount} onChange={(e) => handleChange('discount', parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
            <input type="number" value={invoice.tax} onChange={(e) => handleChange('tax', parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="mt-4 text-right space-y-1">
          <p>Subtotal: <span className="font-semibold">{formatMoney(invoice.subtotal || 0, invoice.currency as any, invoice.language as any)}</span></p>
          <p>Total: <span className="font-bold text-lg">{formatMoney(invoice.total || 0, invoice.currency as any, invoice.language as any)}</span></p>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
      <Toaster position="top-right" />
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Invoice Form...</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
