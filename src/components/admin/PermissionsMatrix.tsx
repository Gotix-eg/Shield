import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface UserPermission {
  page: string; // e.g. "clients" | "projects"
  enabled: boolean;
  clientIds: number[];
  projectIds: number[];
  itemIds: number[]; // for report/settings sub-items
  lawyerIds: number[];
}

interface OptionItem {
  id: number;
  name: string;
}

const PAGES = [
  { key: 'clients', label: 'Clients' },
  { key: 'projects', label: 'Projects' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'lawyersPage', label: 'Lawyers' },
];

export default function PermissionsMatrix({
  userId,
  initialPermissions,
  onSave,
}: {
  userId: number;
  initialPermissions: UserPermission[];
  onSave: (perms: UserPermission[]) => void;
}) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [clients, setClients] = useState<OptionItem[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [lawyers, setLawyers] = useState<OptionItem[]>([]);
  const [reportItems, setReportItems] = useState<OptionItem[]>([]);
  const [settingItems, setSettingItems] = useState<OptionItem[]>([]);

  useEffect(() => {
    setPermissions(
      PAGES.map((p) =>
        initialPermissions.find((ip) => ip.page === p.key) || {
          page: p.key,
          enabled: false,
          clientIds: [],
          projectIds: [],
          lawyerIds: [],
          itemIds: [],
        }
      )
    );
  }, [initialPermissions]);

  // load dropdown data once
  useEffect(() => {
    fetch('/api/clients')
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setClients(d):setClients([]));
    fetch('/api/projects')
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setProjects(d):setProjects([]));
    fetch('/api/lawyers')
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setLawyers(d):setLawyers([]));

    fetch('/api/reports')
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setReportItems(d):setReportItems([]));

    fetch('/api/settings')
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setSettingItems(d):setSettingItems([]));
  }, []);

  const updatePerm = (idx: number, patch: Partial<UserPermission>) => {
    setPermissions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
        <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5 border-b border-white/5">
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Module</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Access</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Clients Filter</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Projects Filter</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Items/Reports</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Personnel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {permissions.map((perm, idx) => (
            <tr key={perm.page} className="group hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-slate-200 font-serif tracking-wide">{PAGES.find((p) => p.key === perm.page)?.label}</td>
              <td className="px-6 py-4 text-center">
                <input
                  type="checkbox"
                  checked={perm.enabled}
                  onChange={(e) =>
                    updatePerm(idx, { enabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all cursor-pointer"
                />
              </td>
              <td className="px-6 py-4">
                {['clients','invoices','reports','settings'].includes(perm.page) && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                    {clients.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 group/label cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.clientIds.includes(c.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...perm.clientIds, c.id]
                              : perm.clientIds.filter((id) => id !== c.id);
                            updatePerm(idx, { clientIds: next });
                          }}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-legal-gold transition-all"
                        />
                        <span className="text-[11px] text-slate-400 group-hover/label:text-slate-200 transition-colors">{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {(['projects','invoices','expenses','reports','settings'].includes(perm.page)) && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 group/label cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.projectIds.includes(p.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...perm.projectIds, p.id]
                              : perm.projectIds.filter((id) => id !== p.id);
                            updatePerm(idx, { projectIds: next });
                          }}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-legal-gold transition-all"
                        />
                        <span className="text-[11px] text-slate-400 group-hover/label:text-slate-200 transition-colors">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {(perm.page === 'reports' || perm.page === 'settings') && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                    {(perm.page === 'reports' ? reportItems : settingItems).map((it) => (
                      <label key={it.id} className="flex items-center gap-2 group/label cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.itemIds.includes(it.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...perm.itemIds, it.id]
                              : perm.itemIds.filter((id) => id !== it.id);
                            updatePerm(idx, { itemIds: next });
                          }}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-legal-gold transition-all"
                        />
                        <span className="text-[11px] text-slate-400 group-hover/label:text-slate-200 transition-colors">{it.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {['lawyersPage','reports','settings','invoices'].includes(perm.page) && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                    {lawyers.map((l) => (
                      <label key={l.id} className="flex items-center gap-2 group/label cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm.lawyerIds.includes(l.id)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...perm.lawyerIds, l.id]
                              : perm.lawyerIds.filter((id) => id !== l.id);
                            updatePerm(idx, { lawyerIds: next });
                          }}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-legal-gold transition-all"
                        />
                        <span className="text-[11px] text-slate-400 group-hover/label:text-slate-200 transition-colors">{l.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => onSave(permissions)}
          className="btn-legal px-10 py-3"
        >
          Save Matrix
        </button>
      </div>
    </div>
  );
}
