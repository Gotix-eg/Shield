'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function BanksPage() {
  const { data, isLoading } = useSWR('/api/banks', fetcher);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [recalcLoading, setRecalcLoading] = useState(false);

  if (isLoading) return <p className="p-8">Loading...</p>;
  const banks = Array.isArray(data) ? data : [];

  const recalculate = async () => {
    if (!confirm('This will recalculate all bank balances from their BankTransaction records. Proceed?')) return;
    setRecalcLoading(true);
    try {
      const res = await fetch('/api/banks/recalculate', { method: 'POST', headers: getHeaders() });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Recalculated ${result.recalculated?.length ?? 0} bank(s)`);
        mutate('/api/banks');
      } else {
        toast.error('Recalculate failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setRecalcLoading(false);
    }
  };

  const addBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const res = await fetch('/api/banks', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, currency }),
    });
    if (res.ok) { mutate('/api/banks'); setName(''); }
    else alert('Save failed');
  };

  return (
    <div className="p-8 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banks</h1>
        <button
          onClick={recalculate}
          disabled={recalcLoading}
          className="text-xs px-3 py-1.5 rounded border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
        >
          {recalcLoading ? 'Recalculating…' : '⟳ Recalculate Balances'}
        </button>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/accounts/banks/transfer" className="text-blue-600 underline">Transfer Funds</Link>
        <Link href="/accounts/project-trust" className="text-blue-600 underline">← Back to Trust Accounts</Link>
      </div>

      {/* Table */}
      {banks.length > 0 && (
        <table className="text-sm border min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-1">Name</th>
              <th className="border px-3 py-1">Currency</th>
              <th className="border px-3 py-1 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b: any) => (
              <tr
                key={b.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => { location.href = `/accounts/banks/${b.id}`; }}
              >
                <td className="border px-3 py-1 text-blue-600 underline">{b.name}</td>
                <td className="border px-3 py-1">{b.currency}</td>
                <td className={`border px-3 py-1 text-right font-mono ${Number(b.balance) < 0 ? 'text-red-500 font-bold' : ''}`}>
                  {Number(b.balance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Bank */}
      <form className="flex gap-2 items-center" onSubmit={addBank}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bank name"
          className="border px-2 py-1"
        />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border px-2 py-1">
          {['EGP', 'USD', 'EUR', 'SAR', 'GBP'].map(c => <option key={c}>{c}</option>)}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Add Bank</button>
      </form>
    </div>
  );
}
