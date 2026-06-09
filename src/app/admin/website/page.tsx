"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutTemplate,
  Info,
  Users,
  Scale,
  Award,
  Mail,
  MessageSquare,
  Calendar,
  Inbox,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Clock,
  MapPin,
  User,
  Check,
  X,
  ChevronRight,
  Shield,
  Loader2,
  FolderKanban
} from "lucide-react";

const TABS = [
  { id: "hero", label: "Hero Section", icon: LayoutTemplate },
  { id: "about", label: "About Section", icon: Info },
  { id: "team", label: "Team Members", icon: Users },
  { id: "practices", label: "Practice Areas", icon: Scale },
  { id: "awards", label: "Awards & Accolades", icon: Award },
  { id: "contact", label: "Contact Info", icon: Mail },
  { id: "faq", label: "FAQs (Chatbot)", icon: MessageSquare },
  { id: "slots", label: "Schedule Slots", icon: Calendar },
  { id: "portalCases", label: "Client Case Tracker", icon: FolderKanban },
  { id: "consultations", label: "Consultation Inbox", icon: Inbox },
  { id: "inquiries", label: "Contact Inquiries", icon: FileText }
];

export default function WebsiteManager() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(true);

  // States for single records
  const [heroData, setHeroData] = useState({ tagline: "", titleFirst: "", titleSecond: "", subtitle: "", ctaBook: "", ctaPortal: "" });
  const [aboutData, setAboutData] = useState({ tagline: "", title: "", description1: "", description2: "" });
  const [contactData, setContactData] = useState({ officeTitle: "", address: "", phone: "", email: "", workingHours: "" });

  // States for lists
  const [teamList, setTeamList] = useState<any[]>([]);
  const [practicesList, setPracticesList] = useState<any[]>([]);
  const [awardsList, setAwardsList] = useState<any[]>([]);
  const [faqList, setFaqList] = useState<any[]>([]);
  const [slotsList, setSlotsList] = useState<any[]>([]);
  const [consultationsList, setConsultationsList] = useState<any[]>([]);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [portalDemoData, setPortalDemoData] = useState<any>(null);

  // Selected case details
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<any | null>(null);
  const [newMilestoneForm, setNewMilestoneForm] = useState({ title: "", dueDate: new Date().toISOString().split("T")[0], status: "PENDING" });
  const [newDocForm, setNewDocForm] = useState({ label: "", url: "" });

  // Modal State
  const [editModal, setEditModal] = useState<{
    type: "team" | "practices" | "awards" | "faq" | "slots" | "consultations" | "inquiries" | "portalCases";
    mode: "new" | "edit" | "view";
    data: any;
  } | null>(null);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getAuth();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const token = getAuth();
    if (!token) return;

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch Hero
      const heroRes = await fetch("/api/website/hero", { headers });
      if (heroRes.ok) {
        const d = await heroRes.json();
        if (d) setHeroData(d);
      }

      // Fetch About
      const aboutRes = await fetch("/api/website/about", { headers });
      if (aboutRes.ok) {
        const d = await aboutRes.json();
        if (d) setAboutData(d);
      }

      // Fetch Contact
      const contactRes = await fetch("/api/website/contact", { headers });
      if (contactRes.ok) {
        const d = await contactRes.json();
        if (d) setContactData(d);
      }

      // Fetch lists
      const [team, practices, awards, faqs, slots, consultations, inquiries, portalDemo] = await Promise.all([
        fetch("/api/website/team", { headers }).then(r => r.json()),
        fetch("/api/website/practices", { headers }).then(r => r.json()),
        fetch("/api/website/awards", { headers }).then(r => r.json()),
        fetch("/api/website/faq", { headers }).then(r => r.json()),
        fetch("/api/website/schedule-slots", { headers }).then(r => r.json()),
        fetch("/api/website/consultations", { headers }).then(r => r.json()),
        fetch("/api/website/inquiries", { headers }).then(r => r.json()),
        fetch("/api/website/portal-demo", { headers }).then(r => r.json())
      ]);

      if (Array.isArray(team)) setTeamList(team);
      if (Array.isArray(practices)) setPracticesList(practices);
      if (Array.isArray(awards)) setAwardsList(awards);
      if (Array.isArray(faqs)) setFaqList(faqs);
      if (Array.isArray(slots)) setSlotsList(slots);
      if (Array.isArray(consultations)) setConsultationsList(consultations);
      if (Array.isArray(inquiries)) setInquiriesList(inquiries);
      if (portalDemo) setPortalDemoData(portalDemo);

    } catch (error) {
      console.error("Error loading CMS data:", error);
      toast.error("Failed to load some website configuration.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const handleSingleSave = async (section: "hero" | "about" | "contact", data: any) => {
    const token = getAuth();
    if (!token) return;

    const promise = fetch(`/api/website/${section}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: `Saving ${section} content...`,
      success: `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`,
      error: (err) => err.message || "Failed to save content"
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAuth();
    if (!token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/website/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setEditModal((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          data: {
            ...prev.data,
            [fieldName]: data.url
          }
        };
      });
      toast.success("File uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    const token = getAuth();
    if (!token) return;

    const { type, mode, data } = editModal;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    let url = `/api/website/${type}`;
    let method = "POST";

    if (mode === "edit") {
      url = `/api/website/${type}/${data.id}`;
      method = "PUT";
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(`${type.toUpperCase()} entry saved successfully!`);
      setEditModal(null);
      fetchAllData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save entry");
    }
  };

  const handleModalDelete = async (type: string, id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Item deleted successfully!");
      setEditModal(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item.");
    }
  };

  const handleInboxStatusChange = async (type: "consultations" | "inquiries", id: number, status: string, notes: string) => {
    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/${type}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Status updated!");
      setEditModal(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleMilestoneCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForDetail) return;
    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/portal/cases/${selectedCaseForDetail.id}/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMilestoneForm)
      });

      if (!res.ok) throw new Error("Failed to add milestone");
      toast.success("Milestone added successfully!");
      setNewMilestoneForm({ title: "", dueDate: new Date().toISOString().split("T")[0], status: "PENDING" });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add milestone.");
    }
  };

  const handleMilestoneDelete = async (milestoneId: number) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/portal/cases/${selectedCaseForDetail.id}/milestones?id=${milestoneId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to delete milestone");
      toast.success("Milestone deleted successfully!");
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete milestone.");
    }
  };

  const handleDocCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForDetail) return;
    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/portal/cases/${selectedCaseForDetail.id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDocForm)
      });

      if (!res.ok) throw new Error("Failed to add document");
      toast.success("Document added successfully!");
      setNewDocForm({ label: "", url: "" });
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add document.");
    }
  };

  const handleDocDelete = async (docId: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    const token = getAuth();
    if (!token) return;

    try {
      const res = await fetch(`/api/website/portal/cases/${selectedCaseForDetail.id}/documents?id=${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to delete document");
      toast.success("Document deleted successfully!");
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document.");
    }
  };

  const handleCaseDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getAuth();
    if (!token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/website/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewDocForm({ label: file.name, url: data.url });
      toast.success("Document uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Document upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans p-6 md:p-10">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-wide">Website Content Manager</h1>
          <p className="text-slate-400 text-xs mt-1">Control the public Shield Advocates homepage, schedule, and case portal.</p>
        </div>
        <button
          onClick={() => window.open("/", "_blank")}
          className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
        >
          <Eye className="w-4 h-4" /> View Live Site
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-medium text-left transition-all ${
                  active
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-l-2 border-[#C5A059]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? "text-[#C5A059]" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 bg-[#0b101d] rounded-xl border border-white/5 p-6 md:p-8 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
            </div>
          ) : (
            <div>
              {/* Tab 1: Hero */}
              {activeTab === "hero" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSingleSave("hero", heroData);
                  }}
                  className="space-y-6 max-w-2xl"
                >
                  <h2 className="text-lg font-bold text-white mb-4">Hero Section Settings</h2>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tagline / Motto</label>
                    <input
                      type="text"
                      value={heroData.tagline}
                      onChange={(e) => setHeroData({ ...heroData, tagline: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      placeholder="e.g. We speak the language of law..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title First Part</label>
                      <input
                        type="text"
                        value={heroData.titleFirst}
                        onChange={(e) => setHeroData({ ...heroData, titleFirst: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                        placeholder="STRATEGIC LEGAL"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title Second Part (Gold)</label>
                      <input
                        type="text"
                        value={heroData.titleSecond}
                        onChange={(e) => setHeroData({ ...heroData, titleSecond: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                        placeholder="SHIELD"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description / Subtitle</label>
                    <textarea
                      rows={5}
                      value={heroData.subtitle}
                      onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                      placeholder="Enter the main presentation paragraphs..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CTA Booking Button Text</label>
                      <input
                        type="text"
                        value={heroData.ctaBook}
                        onChange={(e) => setHeroData({ ...heroData, ctaBook: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                        placeholder="Request Consultation"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">CTA Portal Button Text</label>
                      <input
                        type="text"
                        value={heroData.ctaPortal}
                        onChange={(e) => setHeroData({ ...heroData, ctaPortal: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                        placeholder="Client Workspace"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                  >
                    Save Hero Settings
                  </button>
                </form>
              )}

              {/* Tab 2: About */}
              {activeTab === "about" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSingleSave("about", aboutData);
                  }}
                  className="space-y-6 max-w-2xl"
                >
                  <h2 className="text-lg font-bold text-white mb-4">About Section Settings</h2>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={aboutData.tagline}
                      onChange={(e) => setAboutData({ ...aboutData, tagline: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      placeholder="THE FIRM"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title</label>
                    <input
                      type="text"
                      value={aboutData.title}
                      onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      placeholder="Protecting brand assets..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Paragraph 1</label>
                    <textarea
                      rows={4}
                      value={aboutData.description1}
                      onChange={(e) => setAboutData({ ...aboutData, description1: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Paragraph 2</label>
                    <textarea
                      rows={4}
                      value={aboutData.description2}
                      onChange={(e) => setAboutData({ ...aboutData, description2: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                  >
                    Save About Settings
                  </button>
                </form>
              )}

              {/* Tab 3: Team Members */}
              {activeTab === "team" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Team Members</h2>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: "team",
                          mode: "new",
                          data: { name: "", role: "", bio: "", focus: [], imageUrl: "", videoUrl: "", sortOrder: teamList.length, visible: true }
                        })
                      }
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Image</th>
                          <th className="py-4 px-4 font-semibold">Name</th>
                          <th className="py-4 px-4 font-semibold">Role</th>
                          <th className="py-4 px-4 font-semibold">Visible</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamList.map((member: any) => (
                          <tr key={member.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4">
                              <img src={member.imageUrl || "/images/placeholder.png"} alt={member.name} className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                            </td>
                            <td className="py-4 px-4 font-semibold text-white">{member.name}</td>
                            <td className="py-4 px-4 text-slate-300">{member.role}</td>
                            <td className="py-4 px-4">
                              {member.visible ? (
                                <span className="text-emerald-400 flex items-center gap-1"><Eye className="w-4 h-4" /> Yes</span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-4 h-4" /> No</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setEditModal({ type: "team", mode: "edit", data: member })}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleModalDelete("team", member.id)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-red-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Practice Areas */}
              {activeTab === "practices" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Practice Areas</h2>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: "practices",
                          mode: "new",
                          data: { slug: "", title: "", shortDesc: "", longDesc: "", icon: "Scale", sortOrder: practicesList.length, visible: true }
                        })
                      }
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Practice
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Title</th>
                          <th className="py-4 px-4 font-semibold">Slug</th>
                          <th className="py-4 px-4 font-semibold">Icon</th>
                          <th className="py-4 px-4 font-semibold">Visible</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {practicesList.map((practice: any) => (
                          <tr key={practice.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4 font-semibold text-white">{practice.title}</td>
                            <td className="py-4 px-4 text-slate-300 font-mono">{practice.slug}</td>
                            <td className="py-4 px-4 text-slate-400">{practice.icon}</td>
                            <td className="py-4 px-4">
                              {practice.visible ? (
                                <span className="text-emerald-400 flex items-center gap-1"><Eye className="w-4 h-4" /> Yes</span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-4 h-4" /> No</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setEditModal({ type: "practices", mode: "edit", data: practice })}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleModalDelete("practices", practice.id)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-red-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 5: Awards */}
              {activeTab === "awards" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Awards & Accolades</h2>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: "awards",
                          mode: "new",
                          data: { title: "", institution: "", description: "", sortOrder: awardsList.length, visible: true }
                        })
                      }
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Award
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Award</th>
                          <th className="py-4 px-4 font-semibold">Institution</th>
                          <th className="py-4 px-4 font-semibold">Visible</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awardsList.map((award: any) => (
                          <tr key={award.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4 font-semibold text-white">{award.title}</td>
                            <td className="py-4 px-4 text-slate-300">{award.institution}</td>
                            <td className="py-4 px-4">
                              {award.visible ? (
                                <span className="text-emerald-400 flex items-center gap-1"><Eye className="w-4 h-4" /> Yes</span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-4 h-4" /> No</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setEditModal({ type: "awards", mode: "edit", data: award })}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleModalDelete("awards", award.id)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-red-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 6: Contact Info */}
              {activeTab === "contact" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSingleSave("contact", contactData);
                  }}
                  className="space-y-6 max-w-2xl"
                >
                  <h2 className="text-lg font-bold text-white mb-4">Contact Info Settings</h2>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Office Title</label>
                    <input
                      type="text"
                      value={contactData.officeTitle}
                      onChange={(e) => setContactData({ ...contactData, officeTitle: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      placeholder="e.g. Sheikh Zayed Office"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Address</label>
                    <textarea
                      rows={3}
                      value={contactData.address}
                      onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Working Hours Description</label>
                    <input
                      type="text"
                      value={contactData.workingHours}
                      onChange={(e) => setContactData({ ...contactData, workingHours: e.target.value })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                  >
                    Save Contact Info
                  </button>
                </form>
              )}

              {/* Tab 7: FAQs */}
              {activeTab === "faq" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">FAQs (Chatbot Database)</h2>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: "faq",
                          mode: "new",
                          data: { question: "", answer: "", sortOrder: faqList.length, visible: true }
                        })
                      }
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add FAQ
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Question</th>
                          <th className="py-4 px-4 font-semibold">Visible</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqList.map((faq: any) => (
                          <tr key={faq.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4 font-semibold text-white">{faq.question}</td>
                            <td className="py-4 px-4">
                              {faq.visible ? (
                                <span className="text-emerald-400 flex items-center gap-1"><Eye className="w-4 h-4" /> Yes</span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-4 h-4" /> No</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setEditModal({ type: "faq", mode: "edit", data: faq })}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleModalDelete("faq", faq.id)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-red-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 8: Schedule Slots */}
              {activeTab === "slots" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Schedule Slots</h2>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: "slots",
                          mode: "new",
                          data: { label: "", sortOrder: slotsList.length, active: true }
                        })
                      }
                      className="px-4 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Slot
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Time Slot Label</th>
                          <th className="py-4 px-4 font-semibold">Active</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotsList.map((slot: any) => (
                          <tr key={slot.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4 font-semibold text-white">{slot.label}</td>
                            <td className="py-4 px-4">
                              {slot.active ? (
                                <span className="text-emerald-400 flex items-center gap-1"><Eye className="w-4 h-4" /> Yes</span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1"><EyeOff className="w-4 h-4" /> No</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setEditModal({ type: "slots", mode: "edit", data: slot })}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleModalDelete("schedule-slots", slot.id)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-red-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 9: Consultations */}
              {activeTab === "consultations" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white mb-4">Consultation Requests Inbox</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Name</th>
                          <th className="py-4 px-4 font-semibold">Date / Slot</th>
                          <th className="py-4 px-4 font-semibold">Status</th>
                          <th className="py-4 px-4 font-semibold">Submitted</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultationsList.map((c: any) => (
                          <tr key={c.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white">{c.name}</div>
                              <div className="text-[10px] text-slate-400">{c.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-white">{c.date}</div>
                              <div className="text-[10px] text-[#C5A059]">{c.timeSlot}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400" :
                                c.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                                c.status === "COMPLETED" ? "bg-blue-500/10 text-blue-400" :
                                "bg-amber-500/10 text-amber-400"
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => setEditModal({ type: "consultations", mode: "view", data: c })}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-all"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 10: Inquiries */}
              {activeTab === "inquiries" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white mb-4">Contact Inquiries Inbox</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-4 font-semibold">Name</th>
                          <th className="py-4 px-4 font-semibold">Phone</th>
                          <th className="py-4 px-4 font-semibold">Status</th>
                          <th className="py-4 px-4 font-semibold">Submitted</th>
                          <th className="py-4 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiriesList.map((inq: any) => (
                          <tr key={inq.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-all">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white">{inq.name}</div>
                              <div className="text-[10px] text-slate-400">{inq.email}</div>
                            </td>
                            <td className="py-4 px-4 text-slate-300">{inq.phone || "—"}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inq.status === "REPLIED" ? "bg-emerald-500/10 text-emerald-400" :
                                inq.status === "ARCHIVED" ? "bg-slate-500/10 text-slate-400" :
                                inq.status === "READ" ? "bg-blue-500/10 text-blue-400" :
                                "bg-amber-500/10 text-amber-400"
                              }`}>
                                {inq.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-400">
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => setEditModal({ type: "inquiries", mode: "view", data: inq })}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-all"
                              >
                                View
                              </button>
                            </td>
                  </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Client Case Tracker */}
              {activeTab === "portalCases" && portalDemoData && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-white font-serif tracking-wide">Client Case Tracker (Homepage Preview)</h2>
                      <p className="text-xs text-slate-400">Control the texts, progress timeline, milestones and documents shown in the Case Tracker preview on the homepage.</p>
                    </div>
                  </div>

                  {/* Section 1: Case Details Editor */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const token = getAuth();
                    if (!token) return;
                    const promise = fetch("/api/website/portal-demo", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify(portalDemoData)
                    }).then(async res => {
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || "Failed to save");
                      }
                      return res.json();
                    });

                    toast.promise(promise, {
                      loading: "Saving case workspace details...",
                      success: "Case workspace details and descriptions saved successfully!",
                      error: (err) => err.message || "Failed to save details"
                    });
                  }} className="bg-[#070b13] p-6 rounded-lg border border-white/5 space-y-4 shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-2">Case Workspace Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Portal Title</label>
                        <input
                          type="text"
                          value={portalDemoData.title || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, title: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Case Number (File No)</label>
                        <input
                          type="text"
                          value={portalDemoData.caseNumber || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, caseNumber: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Portal Subtitle</label>
                        <textarea
                          rows={2}
                          value={portalDemoData.subtitle || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, subtitle: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Client Name</label>
                        <input
                          type="text"
                          value={portalDemoData.clientName || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, clientName: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Client Registered Email (For Login)</label>
                        <input
                          type="email"
                          value={portalDemoData.clientEmail || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, clientEmail: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Matter Name</label>
                        <input
                          type="text"
                          value={portalDemoData.matterName || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, matterName: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Court Name</label>
                        <input
                          type="text"
                          value={portalDemoData.courtName || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, courtName: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Status</label>
                        <input
                          type="text"
                          value={portalDemoData.currentStatus || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, currentStatus: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Attorneys (comma separated)</label>
                        <input
                          type="text"
                          value={portalDemoData.assignedAttorneys || ""}
                          onChange={(e) => setPortalDemoData({ ...portalDemoData, assignedAttorneys: e.target.value })}
                          required
                          className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                      >
                        Save Case Details
                      </button>
                    </div>
                  </form>

                  {/* Section 2: Milestones & Documents Editors */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Milestones Editor */}
                    <div className="space-y-6 bg-[#070b13] p-5 rounded-lg border border-white/5 shadow-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Progression Milestones</h3>

                      {/* Add Milestone Form */}
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const token = getAuth();
                        if (!token) return;
                        
                        const newMilestone = {
                          title: newMilestoneForm.title,
                          date: newMilestoneForm.dueDate,
                          status: newMilestoneForm.status,
                          description: ""
                        };

                        const updatedMilestones = [...(portalDemoData.milestones || []), newMilestone];
                        const updatedData = { ...portalDemoData, milestones: updatedMilestones };

                        try {
                          const res = await fetch("/api/website/portal-demo", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(updatedData)
                          });
                          if (!res.ok) throw new Error();
                          
                          setPortalDemoData(updatedData);
                          setNewMilestoneForm({ title: "", dueDate: new Date().toISOString().split("T")[0], status: "PENDING" });
                          toast.success("Milestone added successfully!");
                        } catch (err) {
                          toast.error("Failed to add milestone.");
                        }
                      }} className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Add New Milestone</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Milestone Title (e.g. Opposition Brief)"
                            value={newMilestoneForm.title}
                            onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, title: e.target.value })}
                            required
                            className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                          />
                          <input
                            type="text"
                            placeholder="Date Text (e.g. May 05, 2026)"
                            value={newMilestoneForm.dueDate}
                            onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, dueDate: e.target.value })}
                            required
                            className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] text-white font-mono"
                          />
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <select
                            value={newMilestoneForm.status}
                            onChange={(e) => setNewMilestoneForm({ ...newMilestoneForm, status: e.target.value })}
                            className="bg-[#0b101d] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                          >
                            <option value="DONE">Completed (Done)</option>
                            <option value="PENDING">Upcoming (Pending)</option>
                          </select>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs"
                          >
                            Add Milestone
                          </button>
                        </div>
                      </form>

                      {/* Milestones List */}
                      <div className="space-y-4">
                        {portalDemoData.milestones?.map((m: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-white block">{m.title}</span>
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{m.date}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  m.status === "DONE" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {m.status === "DONE" ? "COMPLETED" : "UPCOMING"}
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!window.confirm("Delete this milestone?")) return;
                                    const token = getAuth();
                                    if (!token) return;

                                    const updatedMilestones = portalDemoData.milestones.filter((_: any, i: number) => i !== idx);
                                    const updatedData = { ...portalDemoData, milestones: updatedMilestones };

                                    try {
                                      const res = await fetch("/api/website/portal-demo", {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify(updatedData)
                                      });
                                      if (!res.ok) throw new Error();
                                      setPortalDemoData(updatedData);
                                      toast.success("Milestone deleted!");
                                    } catch (err) {
                                      toast.error("Failed to delete milestone.");
                                    }
                                  }}
                                  className="p-1 hover:bg-white/5 rounded text-red-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Description Detail</label>
                              <textarea
                                rows={2}
                                value={m.description || ""}
                                placeholder="Details shown when milestone is selected on the portal..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updatedMilestones = portalDemoData.milestones.map((mil: any, i: number) => {
                                    if (i === idx) return { ...mil, description: val };
                                    return mil;
                                  });
                                  setPortalDemoData({ ...portalDemoData, milestones: updatedMilestones });
                                }}
                                className="w-full bg-[#0b101d] border border-white/5 rounded p-2 text-[11px] focus:outline-none focus:border-[#C5A059] text-zinc-300 resize-none font-sans"
                              />
                            </div>
                          </div>
                        ))}
                        {portalDemoData.milestones?.length === 0 && (
                          <p className="text-center text-slate-500 text-xs py-4">No milestones set.</p>
                        )}
                      </div>
                    </div>

                    {/* Documents Editor */}
                    <div className="space-y-6 bg-[#070b13] p-5 rounded-lg border border-white/5 shadow-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">Secure Pleading Documents</h3>

                      {/* Add Document Form */}
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const token = getAuth();
                        if (!token) return;

                        const newDoc = {
                          name: newDocForm.label,
                          url: newDocForm.url,
                          size: "Varies",
                          type: "PDF",
                          date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                        };

                        const updatedDocuments = [...(portalDemoData.documents || []), newDoc];
                        const updatedData = { ...portalDemoData, documents: updatedDocuments };

                        try {
                          const res = await fetch("/api/website/portal-demo", {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(updatedData)
                          });
                          if (!res.ok) throw new Error();

                          setPortalDemoData(updatedData);
                          setNewDocForm({ label: "", url: "" });
                          toast.success("Document added successfully!");
                        } catch (err) {
                          toast.error("Failed to add document.");
                        }
                      }} className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Add New Document</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Document Name (e.g. Brief.pdf)"
                            value={newDocForm.label}
                            onChange={(e) => setNewDocForm({ ...newDocForm, label: e.target.value })}
                            required
                            className="w-full bg-[#0b101d] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="File URL"
                              value={newDocForm.url}
                              onChange={(e) => setNewDocForm({ ...newDocForm, url: e.target.value })}
                              required
                              className="w-full flex-1 bg-[#0b101d] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                            />
                            <label className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0">
                              {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <input
                                type="file"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const token = getAuth();
                                  if (!token) return;

                                  setUploading(true);
                                  const formData = new FormData();
                                  formData.append("file", file);

                                  try {
                                    const res = await fetch("/api/website/upload", {
                                      method: "POST",
                                      headers: { Authorization: `Bearer ${token}` },
                                      body: formData
                                    });
                                    if (!res.ok) throw new Error();
                                    const data = await res.json();
                                    setNewDocForm({ label: file.name, url: data.url });
                                    toast.success("File uploaded to storage!");
                                  } catch (err) {
                                    toast.error("Upload failed.");
                                  } finally {
                                    setUploading(false);
                                  }
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs"
                          >
                            Add Document
                          </button>
                        </div>
                      </form>

                      {/* Documents List */}
                      <div className="space-y-3.5">
                        {portalDemoData.documents?.map((doc: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-xs">
                            <div>
                              <span className="font-semibold text-white block">{doc.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{doc.date} | {doc.size || "Varies"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#C5A059] hover:underline font-semibold"
                              >
                                View File
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm("Delete this document?")) return;
                                  const token = getAuth();
                                  if (!token) return;

                                  const updatedDocs = portalDemoData.documents.filter((_: any, i: number) => i !== idx);
                                  const updatedData = { ...portalDemoData, documents: updatedDocs };

                                  try {
                                    const res = await fetch("/api/website/portal-demo", {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                      },
                                      body: JSON.stringify(updatedData)
                                    });
                                    if (!res.ok) throw new Error();
                                    setPortalDemoData(updatedData);
                                    toast.success("Document deleted!");
                                  } catch (err) {
                                    toast.error("Failed to delete document.");
                                  }
                                }}
                                className="p-1 hover:bg-white/5 rounded text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {portalDemoData.documents?.length === 0 && (
                          <p className="text-center text-slate-500 text-xs py-4">No documents uploaded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* CRUD / VIEW MODALS */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-[#0b101d] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between bg-[#070b13] px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                {editModal.mode} {editModal.type} entry
              </h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TEAM MEMBER FORM */}
            {editModal.type === "team" && (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Name</label>
                    <input
                      type="text"
                      value={editModal.data.name}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, name: e.target.value } })}
                      required
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role</label>
                    <input
                      type="text"
                      value={editModal.data.role}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, role: e.target.value } })}
                      required
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bio</label>
                  <textarea
                    rows={4}
                    value={editModal.data.bio}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, bio: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Focus Areas (Comma Separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editModal.data.focus) ? editModal.data.focus.join(", ") : editModal.data.focus}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, focus: e.target.value.split(",").map((s: string) => s.trim()) } })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Photo Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editModal.data.imageUrl}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, imageUrl: e.target.value } })}
                      required
                      className="flex-1 bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                    <label className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer text-white flex items-center gap-1.5 transition-all">
                      <Upload className="w-4 h-4" /> Upload
                      <input type="file" onChange={(e) => handleFileUpload(e, "imageUrl")} accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Intro Video URL (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editModal.data.videoUrl || ""}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, videoUrl: e.target.value } })}
                      className="flex-1 bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                      placeholder="/video/hassan.mp4"
                    />
                    <label className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer text-white flex items-center gap-1.5 transition-all">
                      <Upload className="w-4 h-4" /> Upload
                      <input type="file" onChange={(e) => handleFileUpload(e, "videoUrl")} accept="video/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editModal.data.sortOrder}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, sortOrder: parseInt(e.target.value) } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="member-visible"
                      checked={editModal.data.visible}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, visible: e.target.checked } })}
                      className="accent-[#C5A059] h-4 w-4"
                    />
                    <label htmlFor="member-visible" className="text-xs font-bold text-slate-300">Visible on Homepage</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all disabled:opacity-50">
                    {uploading ? "Uploading..." : "Save Member"}
                  </button>
                </div>
              </form>
            )}

            {/* PRACTICE AREA FORM */}
            {editModal.type === "practices" && (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editModal.data.title}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, title: e.target.value } })}
                      required
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Slug (Unique ID)</label>
                    <input
                      type="text"
                      value={editModal.data.slug}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, slug: e.target.value } })}
                      required
                      disabled={editModal.mode === "edit"}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white disabled:opacity-50"
                      placeholder="e.g. intellectual-property"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Short Description</label>
                  <input
                    type="text"
                    value={editModal.data.shortDesc}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, shortDesc: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Long Description (Detailed presentation)</label>
                  <textarea
                    rows={5}
                    value={editModal.data.longDesc}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, longDesc: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lucide Icon Name</label>
                    <select
                      value={editModal.data.icon}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, icon: e.target.value } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    >
                      <option value="ShieldAlert">ShieldAlert</option>
                      <option value="Briefcase">Briefcase</option>
                      <option value="Users">Users</option>
                      <option value="Scale">Scale</option>
                      <option value="TrendingUp">TrendingUp</option>
                      <option value="DollarSign">DollarSign</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editModal.data.sortOrder}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, sortOrder: parseInt(e.target.value) } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="practice-visible"
                    checked={editModal.data.visible}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, visible: e.target.checked } })}
                    className="accent-[#C5A059] h-4 w-4"
                  />
                  <label htmlFor="practice-visible" className="text-xs font-bold text-slate-300">Visible on Homepage</label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                    Save Practice
                  </button>
                </div>
              </form>
            )}

            {/* AWARDS FORM */}
            {editModal.type === "awards" && (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Award Title</label>
                  <input
                    type="text"
                    value={editModal.data.title}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, title: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    placeholder="e.g. Leading Firm - Egypt"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Institution</label>
                  <input
                    type="text"
                    value={editModal.data.institution}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, institution: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    placeholder="e.g. The Legal 500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editModal.data.description}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, description: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editModal.data.sortOrder}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, sortOrder: parseInt(e.target.value) } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="award-visible"
                      checked={editModal.data.visible}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, visible: e.target.checked } })}
                      className="accent-[#C5A059] h-4 w-4"
                    />
                    <label htmlFor="award-visible" className="text-xs font-bold text-slate-300">Visible on Homepage</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                    Save Award
                  </button>
                </div>
              </form>
            )}

            {/* FAQ FORM */}
            {editModal.type === "faq" && (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Question</label>
                  <input
                    type="text"
                    value={editModal.data.question}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, question: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Answer</label>
                  <textarea
                    rows={4}
                    value={editModal.data.answer}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, answer: e.target.value } })}
                    required
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editModal.data.sortOrder}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, sortOrder: parseInt(e.target.value) } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="faq-visible"
                      checked={editModal.data.visible}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, visible: e.target.checked } })}
                      className="accent-[#C5A059] h-4 w-4"
                    />
                    <label htmlFor="faq-visible" className="text-xs font-bold text-slate-300">Visible on Chatbot</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                    Save FAQ
                  </button>
                </div>
              </form>
            )}

            {/* SCHEDULE SLOT FORM */}
            {editModal.type === "slots" && (
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Time Slot Label</label>
                  <input
                    type="text"
                    value={editModal.data.label}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, label: e.target.value } })}
                    required
                    placeholder="e.g. 09:30 AM - 10:00 AM"
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editModal.data.sortOrder}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, sortOrder: parseInt(e.target.value) } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="slot-active"
                      checked={editModal.data.active}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, active: e.target.checked } })}
                      className="accent-[#C5A059] h-4 w-4"
                    />
                    <label htmlFor="slot-active" className="text-xs font-bold text-slate-300">Slot Active</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                    Save Slot
                  </button>
                </div>
              </form>
            )}

            {/* VIEW CONSULTATIONS INBOX */}
            {editModal.type === "consultations" && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070b13] p-4 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Client Name</span>
                    <span className="text-sm font-bold text-white">{editModal.data.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Company</span>
                    <span className="text-sm font-bold text-white">{editModal.data.company || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Email</span>
                    <span className="text-sm text-slate-300">{editModal.data.email}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Phone</span>
                    <span className="text-sm text-slate-300">{editModal.data.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Selected Date</span>
                    <span className="text-sm text-white">{editModal.data.date}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Selected Slot</span>
                    <span className="text-sm text-[#C5A059] font-semibold">{editModal.data.timeSlot}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Inquiry / Case Summary</span>
                  <div className="bg-[#070b13] p-4 rounded-lg border border-white/5 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                    {editModal.data.summary || "No description provided."}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Status</label>
                    <select
                      value={editModal.data.status}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, status: e.target.value } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Administrative Notes</label>
                  <textarea
                    rows={3}
                    value={editModal.data.notes || ""}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, notes: e.target.value } })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                    placeholder="Enter internal follow-up notes..."
                  />
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleModalDelete("consultations", editModal.data.id)}
                    className="px-4 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded-lg text-xs font-bold text-red-400 transition-all"
                  >
                    Delete Request
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInboxStatusChange("consultations", editModal.data.id, editModal.data.status, editModal.data.notes)}
                      className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                    >
                      Save Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW CONTACT INQUIRIES */}
            {editModal.type === "inquiries" && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070b13] p-4 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Client Name</span>
                    <span className="text-sm font-bold text-white">{editModal.data.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Phone</span>
                    <span className="text-sm text-slate-300">{editModal.data.phone || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Email</span>
                    <span className="text-sm text-slate-300">{editModal.data.email}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Message</span>
                  <div className="bg-[#070b13] p-4 rounded-lg border border-white/5 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                    {editModal.data.message}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Status</label>
                    <select
                      value={editModal.data.status}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, status: e.target.value } })}
                      className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white"
                    >
                      <option value="NEW">NEW</option>
                      <option value="READ">READ</option>
                      <option value="REPLIED">REPLIED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Administrative Notes</label>
                  <textarea
                    rows={3}
                    value={editModal.data.notes || ""}
                    onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, notes: e.target.value } })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] text-white resize-none"
                    placeholder="Enter internal notes..."
                  />
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleModalDelete("inquiries", editModal.data.id)}
                    className="px-4 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 rounded-lg text-xs font-bold text-red-400 transition-all"
                  >
                    Delete Inquiry
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditModal(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInboxStatusChange("inquiries", editModal.data.id, editModal.data.status, editModal.data.notes)}
                      className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                    >
                      Save Status
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
