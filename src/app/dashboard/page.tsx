'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/fetchAuth';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Company {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export default function DashboardHome() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetchAuth("/api/company");
        if (res.status === 404) {
          setCompany(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to load company");
        const data = await res.json();
        setCompany(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  return (
    <div className="px-8 py-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 text-right">
          <h1 className="text-5xl font-serif mb-4 text-white tracking-tight">
            لوحة التحكم
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light leading-relaxed ml-auto">
            مرحباً بك مجدداً. إليك ملخص لحالة المكتب وأدوات الإدارة الأساسية.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-golden">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-golden">
            {loading ? (
              <div className="legal-card p-golden flex items-center justify-center min-h-[300px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/5"></div>
                  <div className="h-4 w-48 bg-white/5 rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="legal-card p-golden border-red-500/20 bg-red-500/5">
                <h3 className="text-red-400 font-serif text-xl mb-2 text-right">تنبيه</h3>
                <p className="text-red-300/70 text-right">{error}</p>
              </div>
            ) : company ? (
              <section className="legal-card p-golden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex items-center justify-between mb-8 flex-row-reverse">
                  <h2 className="text-2xl font-serif text-white">ملف المكتب</h2>
                  <div className="h-px flex-1 mx-6 bg-white/5"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold">نشط</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                  <div className="group">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">اسم المكتب</p>
                    <p className="text-lg text-white font-medium">{company.name}</p>
                  </div>
                  {company.email && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">التواصل الرقمي</p>
                      <p className="text-lg text-white font-medium">{company.email}</p>
                    </div>
                  )}
                  {company.phone && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">الخط المباشر</p>
                      <p className="text-lg text-white font-medium">{company.phone}</p>
                    </div>
                  )}
                  {company.address && (
                    <div className="md:col-span-2 group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">العنوان الفعلي</p>
                      <p className="text-lg text-white font-medium leading-snug">{company.address}</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="legal-card p-golden text-center py-16">
                <p className="text-slate-400 font-light italic">لا توجد بيانات مكتب حالياً. يرجى تهيئتها في الإعدادات.</p>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link href="/clients/new" className="legal-card p-8 group hover:border-legal-gold/30 transition-all text-right">
                <h3 className="text-xl font-serif mb-2 text-white group-hover:text-legal-gold transition-colors">عميل جديد</h3>
                <p className="text-sm text-slate-500 font-light">إضافة عميل جديد إلى النظام.</p>
              </Link>
              <Link href="/invoices" className="legal-card p-8 group hover:border-legal-gold/30 transition-all text-right">
                <h3 className="text-xl font-serif mb-2 text-white group-hover:text-legal-gold transition-colors">الفواتير</h3>
                <p className="text-sm text-slate-500 font-light">مراجعة الفواتير المعلقة والمدفوعات.</p>
              </Link>
            </div>
          </div>

          {/* Sidebar / Stats */}
          <aside className="space-y-golden text-right">
            <div className="legal-card p-golden bg-[#111827] text-white border-none shadow-2xl">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-6 mr-1">نظرة سريعة</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 flex-row-reverse">
                  <span className="text-white/60 text-sm font-light">المشاريع الأخيرة</span>
                  <span className="text-3xl font-serif text-white">12</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4 flex-row-reverse">
                  <span className="text-white/60 text-sm font-light">المهام المعلقة</span>
                  <span className="text-3xl font-serif text-white">08</span>
                </div>
                <div className="flex justify-between items-end flex-row-reverse">
                  <span className="text-white/60 text-sm font-light">فواتير غير مدفوعة</span>
                  <span className="text-3xl font-serif text-legal-gold">04</span>
                </div>
              </div>
            </div>

            <div className="legal-card p-golden border-dashed border-2 border-white/5 bg-transparent shadow-none hover:border-legal-gold/50 transition-all cursor-help">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold">ذكاء PRO LAW</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light italic">
                "الدقة هي روح العدالة."
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

}