'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getAuth } from '@/lib/auth';

interface CostRow {
  projectId: number;
  projectName: string;
  lawyerId: number;
  lawyerName: string;
  hours: number;
  rate: number;
  currency: string | null;
}

type TotalsMap = Record<string, { total: number }>;
type DraftsMap = Record<number, number>; // projectId → draft invoice id

function findAssignment(projectId: number, lawyerId: number, list: any[]) {
  return list.find((a) => a.projectId === projectId && a.userId === lawyerId);
}

export default function CostsReportPage() {
  const { t } = useTranslation('reports');
  const token = getAuth();

  const [rows, setRows] = useState<CostRow[]>([]);
  const [totals, setTotals] = useState<TotalsMap>({});
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<DraftsMap>({});

  /* ---------- filters ---------- */
  const [clientFilter, setClientFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [lawyerFilter, setLawyerFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- static lists ---------- */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, pRes, lRes, aRes] = await Promise.all([
        fetch('/api/clients', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/lawyers', { headers }),
        fetch('/api/assignments', { headers }),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      if (lRes.ok) setLawyers(await lRes.json());
      if (aRes.ok) setAssignments(await aRes.json());
    })();
  }, [token]);

  /* ---------- fetch report ---------- */
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      if (clientFilter) qs.append('clientId', clientFilter);
      if (projectFilter) qs.append('projectId', projectFilter);
      if (lawyerFilter) qs.append('userId', lawyerFilter);
      if (from) qs.append('from', new Date(from).toISOString());
      if (to) qs.append('to', new Date(to).toISOString());

      const res = await fetch(`/api/reports/costs?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();
      setRows(data.rows || []);
      setTotals(data.totals || {});
      setDrafts(data.drafts || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  /* ---------- grouping ---------- */
  const grouped = rows.reduce<Record<string, CostRow[]>>((acc, r) => {
    const key = `${r.projectName}|${r.currency ?? ''}`;
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  /* ---------- UI ---------- */
  return (
    <div className="dashboard-container max-w-5xl">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">
          {t('title', { defaultValue: 'Costs Report' })}
        </h1>
        <p className="text-slate-400 font-light max-w-xl">
          {t('subtitle', { defaultValue: 'Analyze costs by project, lawyer, and period.' })}
        </p>
      </header>

      {/* filters */}
      <form
        className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7"
        onSubmit={(e) => {
          e.preventDefault();
          fetchData();
        }}
      >
        {/* client */}
        <select
          className="w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setProjectFilter('');
          }}
        >
          <option value="" className="bg-slate-900">{t('filters.allClients', { defaultValue: 'All Clients' })}</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id} className="bg-slate-900">
              {c.name}
            </option>
          ))}
        </select>

        {/* project */}
        <select
          className="w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="" className="bg-slate-900">{t('filters.allProjects', { defaultValue: 'All Projects' })}</option>
          {projects
            .filter((p: any) => !clientFilter || p.clientId === Number(clientFilter))
            .map((p: any) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name}
              </option>
            ))}
        </select>

        {/* lawyer */}
        <select
          className="w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
          value={lawyerFilter}
          onChange={(e) => setLawyerFilter(e.target.value)}
        >
          <option value="" className="bg-slate-900">{t('filters.allLawyers', { defaultValue: 'All Lawyers' })}</option>
          {lawyers.map((l: any) => (
            <option key={l.id} value={l.id} className="bg-slate-900">
              {l.name}
            </option>
          ))}
        </select>

        {/* date range */}
        <input
          type="date"
          className="w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        {/* buttons */}
        <button
          type="submit"
          className="btn-legal w-full min-w-0 sm:col-span-1 xl:col-span-1"
        >
          {t('buttons.applyFilters', { defaultValue: 'Apply Filters' })}
        </button>
        <button
          type="button"
          className="btn-legal-outline w-full min-w-0 sm:col-span-1 xl:col-span-1"
          onClick={() => {
            setClientFilter('');
            setProjectFilter('');
            setLawyerFilter('');
            setFrom('');
            setTo('');
            fetchData();
          }}
        >
          {t('buttons.reset', { defaultValue: 'Reset' })}
        </button>
      </form>

      {/* table */}
      {loading ? (
        <p className="text-slate-500 italic font-light">Loading…</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="legal-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="border-0 px-3 py-2 text-left">{t('headers.project', { defaultValue: 'Project' })}</th>
                <th className="border-0 px-3 py-2 text-left">{t('headers.lawyer', { defaultValue: 'Lawyer' })}</th>
                <th className="border-0 px-3 py-2 text-right">{t('headers.hours', { defaultValue: 'Hours' })}</th>
                <th className="border-0 px-3 py-2 text-right">{t('headers.rate', { defaultValue: 'Rate' })}</th>
                <th className="border-0 px-3 py-2 text-right">{t('headers.total', { defaultValue: 'Total' })}</th>
                <th className="border-0 px-3 py-2 text-center">{t('headers.ready', { defaultValue: 'Ready' })}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const currencyTotals: Record<string, number> = {};

                return (
                  <>
                    {Object.entries(grouped).map(([key, list]) => {
                      const [projectName, currency = ''] = key.split('|');
                      const projectHours = list.reduce((s, r) => s + r.hours, 0);
                      const projectTotal = list.reduce((s, r) => s + (Number(r.rate || 0) * r.hours), 0);
                      currencyTotals[currency] = (currencyTotals[currency] || 0) + projectTotal;

                      return (
                        <React.Fragment key={key}>
                          {/* project subtotal */}
                          <tr className="bg-legal-gold/10 font-semibold">
                            <td className="border-0 px-3 py-2">{projectName}</td>
                            <td className="border-0 px-3 py-2" />
                            <td className="border-0 px-3 py-2 text-right">{projectHours.toFixed(2)}</td>
                            <td className="border-0 px-3 py-2 text-right" />
                            <td className="border-0 px-3 py-2 text-right">
                              {currency} {projectTotal.toFixed(2)}
                            </td>
                            <td className="border-0 px-3 py-2" />
                          </tr>

                          {/* lawyer rows */}
                          {list.map((r: CostRow) => {
                            const asn = findAssignment(r.projectId, r.lawyerId, assignments);
                            const ready = asn?.readyForInvoicing ?? false;
                            const total = Number(r.rate || 0) * r.hours;

                            return (
                              <tr key={`${r.projectId}-${r.lawyerId}`} className="hover:bg-white/5 transition-colors">
                                <td className="border-0 px-3 py-2" />
                                <td className="border-0 px-3 py-2">{r.lawyerName}</td>
                                <td className="border-0 px-3 py-2 text-right">{r.hours.toFixed(2)}</td>
                                <td className="border-0 px-3 py-2 text-right">
                                  {r.currency} {(Number(r.rate) || 0).toFixed(2)}
                                </td>
                                <td className="border-0 px-3 py-2 text-right">
                                  {r.currency} {total.toFixed(2)}
                                </td>
                                <td className="border-0 px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={ready}
                                    onChange={async () => {
                                      if (!asn) return;
                                      await fetch(`/api/assignments/${asn.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ readyForInvoicing: !ready }),
                                      });
                                      setAssignments((prev) =>
                                        prev.map((a: any) =>
                                          a.id === asn.id ? { ...a, readyForInvoicing: !ready } : a,
                                        ),
                                      );
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}

                    {/* grand totals */}
                    {Object.entries(currencyTotals)
                      .filter(([, tot]) => tot > 0)
                      .map(([cur, tot]) => (
                        <tr key={cur} className="bg-white/5 font-bold border-t border-white/5">
                          <td colSpan={4} />
                          <td className="border-0 px-3 py-2 text-right text-legal-gold">
                            {cur} {tot.toFixed(2)}
                          </td>
                          <td />
                        </tr>
                      ))}
                  </>
                );
              })()}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
