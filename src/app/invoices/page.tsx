'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types/invoice';
import { useTranslation, formatDate, formatMoney } from '@/lib/i18n';
import { enUS } from 'date-fns/locale';
import { format as formatDateFn } from 'date-fns';
import Link from 'next/link';

export default function InvoicesPage() {
  const { t } = useTranslation('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<string>('DRAFT');
  const router = useRouter();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const token = getAuth();

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete (HTTP ${res.status})`);
      }
      toast.success('Invoice deleted');
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Delete failed');
    }
  };

  const startEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setTempStatus(inv.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: tempStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update (HTTP ${res.status})`);
      }
      const updated = await res.json();
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
      toast.success('Invoice updated');
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Update failed');
    } finally {
      cancelEdit();
    }
  };

  // Accountant approve invoice with currency selection
  const approveInvoice = async (id: string) => {
    const currency = prompt('Select currency code (e.g. USD, EUR, SAR):');
    if (!currency) return;
    try {
      const res = await fetch(`/api/invoices/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to approve (HTTP ${res.status})`);
      }
      const updated = await res.json();
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
      toast.success('Invoice approved');
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Approve failed');
    }
  };

  return (
    <div className="px-8 py-12 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">الفواتير</h1>
          <p className="text-slate-400 font-light max-w-xl">إدارة المطالبات المالية والتحصيل بكفاءة عالية.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/dashboard/invoices/new') }
            className="btn-legal"
          >
            <span className="text-xl">+</span> فاتورة جديدة
          </button>
        </div>
      </header>

      <div className="legal-card overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">رقم الفاتورة</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">العميل</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">المشروع</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">التاريخ</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">الحالة</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">البنك</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">الإجمالي</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-16 text-center text-slate-500 font-light italic">
                    لا توجد فواتير حالياً.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{invoice.invoiceNumber}</td>
                    <td className="px-8 py-6">
                      <span className="text-slate-200 font-medium group-hover:text-legal-gold transition-colors">
                        {invoice.client?.name}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-sm font-light">{invoice.project?.name || '-'}</td>
                    <td className="px-8 py-6 text-slate-400 text-sm font-light">
                      {formatDate(invoice.issueDate, invoice.language)}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                        invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        invoice.status === 'SENT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-sm font-light">{invoice.bank?.name || '-'}</td>
                    <td className="px-8 py-6 text-legal-gold font-bold">
                      {formatMoney(invoice.total, invoice.currency, invoice.language)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/invoices/${invoice.invoiceNumber}`)}
                          className="text-slate-400 hover:text-legal-gold transition-colors p-1"
                          title="عرض"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {(invoice.status as any) === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => approveInvoice(invoice.id as string)}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                            title="اعتماد"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id as string)}
                          className="text-slate-400 hover:text-red-400 transition-colors p-1"
                          title="حذف"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Toaster position="top-right" />
        </div>
      </div>
    </div>
  );
}
