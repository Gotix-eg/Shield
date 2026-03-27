"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { fetchClients } from "@/lib/api";
import Link from "next/link";

interface Client {
  id: number;
  name: string;
  contactEmail: string;
  phone: string;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const token = getAuth();
    if (!token) {
      router.push("/login");
      return;
    }

    // جلب قائمة العملاء
    fetchClients()
      .then((data: Client[]) => {
        setClients(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  return (
    <div className="px-8 py-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div>
            <h1 className="text-4xl font-serif text-legal-900 mb-2">Client Directory</h1>
            <p className="text-slate-500 font-light">Maintain and manage your firm's professional relationships.</p>
          </div>
          <Link
            href="/clients/new"
            className="inline-flex items-center px-6 py-3 bg-legal-900 text-white text-sm font-serif tracking-widest hover:bg-legal-gold transition-all duration-300 group shadow-lg"
          >
            <span className="mr-2">+</span> NEW CLIENT
          </Link>
        </header>

        <div className="legal-card overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Identity</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Communication</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Acquisition Date</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-light italic">
                      The directory is currently empty.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-legal-900 flex items-center justify-center text-legal-gold font-serif text-xs shrink-0">
                            {client.name.charAt(0)}
                          </div>
                          <span className="text-legal-900 font-medium group-hover:text-legal-gold transition-colors">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-600">{client.contactEmail}</span>
                          <span className="text-xs text-slate-400 font-light">{client.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-slate-500 font-light">
                          {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-legal-gold transition-colors inline-flex items-center gap-2"
                        >
                          VIEW DOSSIER <span className="text-lg">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <footer className="mt-8 flex justify-between items-center px-4">
          <p className="text-xs text-slate-400 font-light">Showing {clients.length} professional entities</p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-legal-gold"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}