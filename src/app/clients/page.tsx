'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { getAuth } from '@/lib/auth';
import { Client } from '@/types/client';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempVatCode, setTempVatCode] = useState('');
  const [tempCountry, setTempCountry] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const token = getAuth();

  // ---------------- API helpers ----------------
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const auth = getAuth();
      if (!auth) {
        toast.error('Not logged in');
        return;
      }
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to delete (HTTP ${res.status})`);
      }
      toast.success('Client deleted');
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Delete failed');
    }
  };

  const saveEdit = async (id: string) => {
    if (!tempName.trim()) return;
    const payload: Record<string, string> = { name: tempName.trim() };
    if (tempEmail.trim()) payload.contactEmail = tempEmail.trim();
    if (tempPhone.trim()) payload.phone = tempPhone.trim();
    if (tempAddress.trim()) payload.address = tempAddress.trim();
    if (tempCity.trim()) payload.city = tempCity.trim();
    if (tempVatCode.trim()) payload.vatCode = tempVatCode.trim();
    if (tempCountry.trim()) payload.country = tempCountry.trim();
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update (HTTP ${res.status})`);
      }
      toast.success('Client updated');
      setClients(prev => prev.map(c => c.id === id ? {
        ...c,
        name: tempName.trim(),
        contactEmail: tempEmail.trim(),
        phone: tempPhone.trim(),
        address: tempAddress.trim(),
        city: tempCity.trim(),
        vatCode: tempVatCode.trim(),
        country: tempCountry.trim()
      } : c));
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    } finally {
      cancelEdit();
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setTempName(c.name);
    setTempEmail(c.contactEmail || "");
    setTempPhone(c.phone || "");
    setTempAddress(c.address || "");
    setTempCity(c.city || "");
    setTempVatCode(c.vatCode || "");
    setTempCountry(c.country || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempName('');
    setTempEmail('');
    setTempPhone('');
    setTempAddress('');
    setTempCity('');
    setTempVatCode('');
    setTempCountry('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Imported ${data.count} clients successfully.`);
      if (data.errors > 0) {
        toast.error(`${data.errors} rows failed to import. Check console.`);
      }
      fetchClients();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="px-8 py-12 min-h-screen">
      <Toaster />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Clients</h1>
          <p className="text-slate-400 font-light max-w-xl">Maintain and manage your firm's professional relationships.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/templates/clients_import_template.csv?v=${Date.now()}`}
            download
            className="btn-legal-outline flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Template
          </a>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv"
          />

          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="btn-legal-outline flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>

          <button
            onClick={() => router.push('/dashboard/clients/new')}
            className="btn-legal"
          >
            <span className="text-xl">+</span> NEW CLIENT
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-legal-gold" />
        </div>
      )}

      {error && (
        <div className="legal-card p-6 border-red-500/20 bg-red-500/5 mb-8">
          <h3 className="font-serif text-red-400 text-lg mb-1">Error</h3>
          <p className="text-red-300/70">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="legal-card overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Code</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Name</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Email</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Phone</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">City</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Country</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-slate-500 font-light italic">
                      The directory is currently empty.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{client.code || '-'}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-legal-gold/10 flex items-center justify-center text-legal-gold font-serif text-xs border border-legal-gold/20">
                            {client.name.charAt(0)}
                          </div>
                          <span className="text-slate-200 font-medium group-hover:text-legal-gold transition-colors">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-300 text-sm">{client.contactEmail}</td>
                      <td className="px-8 py-6 text-slate-400 text-sm font-light">{client.phone}</td>
                      <td className="px-8 py-6 text-slate-400 text-sm font-light">{client.city}</td>
                      <td className="px-8 py-6 text-slate-400 text-sm font-light">{client.country}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/clients/${client.id}`)}
                            className="text-slate-400 hover:text-legal-gold transition-colors p-1"
                            title="View"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-1"
                            title="Delete"
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
          </div>
        </div>
      )}
    </div>
  );
}