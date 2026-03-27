'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Client } from '@/types/client';

export default function NewClientPage() {
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
    city: '',
    vatCode: '',
    country: '',
    notes: ''
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      toast.success('Client created successfully');
      router.push('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  return (
    <div className="px-8 py-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div>
            <h1 className="text-4xl font-serif text-legal-900 mb-2">New Client Intake</h1>
            <p className="text-slate-500 font-light">Register a new professional entity into the ProLaw system.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/clients')}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 hover:text-legal-gold transition-colors pb-1 border-b border-transparent hover:border-legal-gold"
          >
            ← CANCEL & RETURN
          </button>
        </header>

        <form onSubmit={handleSubmit} className="legal-card p-golden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Identity Section */}
            <div className="md:col-span-2 border-b border-slate-50 pb-4 mb-4">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold">Identity & Branding</h3>
            </div>
            
            <div className="group md:col-span-2">
              <label htmlFor="name" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Full Legal Name <span className="text-legal-copper">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="The Smith Group LLC"
                required
              />
            </div>

            {/* Communication Section */}
            <div className="md:col-span-2 border-b border-slate-50 pb-4 mb-4 mt-8">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold">Communication Channels</h3>
            </div>

            <div className="group">
              <label htmlFor="contactEmail" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Primary Email Address
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="contact@firm.com"
              />
            </div>

            <div className="group">
              <label htmlFor="phone" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Secure Phone Line
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Logistics Section */}
            <div className="md:col-span-2 border-b border-slate-50 pb-4 mb-4 mt-8">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold">Logistics & Compliance</h3>
            </div>

            <div className="group md:col-span-2">
              <label htmlFor="address" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Registered Physical Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium min-h-[60px] resize-none"
                placeholder="123 Avenue of Justice..."
                rows={2}
              />
            </div>

            <div className="group">
              <label htmlFor="city" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                City of Operation
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="London"
              />
            </div>

            <div className="group">
              <label htmlFor="country" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Jurisdiction / Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="United Kingdom"
              />
            </div>

            <div className="group">
              <label htmlFor="vatCode" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                VAT / Tax Identification
              </label>
              <input
                type="text"
                id="vatCode"
                name="vatCode"
                value={formData.vatCode}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium"
                placeholder="VAT-123456789"
              />
            </div>

            <div className="group md:col-span-2">
              <label htmlFor="notes" className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 group-focus-within:text-legal-gold transition-colors">
                Confidential Dossier Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-white border-b border-slate-200 py-2 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-legal-900 font-medium min-h-[100px] resize-none"
                placeholder="Additional details regarding the client relationship..."
                rows={4}
              />
            </div>

            <div className="md:col-span-2 pt-12">
              <button
                type="submit"
                className="w-full md:w-auto px-12 py-4 bg-legal-900 text-white font-serif tracking-widest hover:bg-legal-gold transition-all duration-500 relative overflow-hidden group shadow-2xl"
              >
                <span className="relative z-10">SAVE CLIENT PROFILE</span>
                <div className="absolute inset-0 bg-legal-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
