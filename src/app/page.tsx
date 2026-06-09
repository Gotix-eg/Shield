"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Briefcase,
  Scale,
  TrendingUp,
  DollarSign,
  Users,
  Menu,
  X,
  Calendar,
  Send,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Check,
  FileText,
  Lock,
  ChevronLeft,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Award,
  Star,
  Quote,
} from "lucide-react";

import { websiteContent } from "@/data/websiteContent";

/* ─── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─── Intersection Observer hook ─────────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Practice icon resolver ──────────────────────────────────────── */
function PracticeIcon({ name }: { name: string }) {
  const cls = "w-6 h-6 text-[#C5A059]";
  switch (name) {
    case "ShieldAlert": return <Shield className={cls} />;
    case "Briefcase":  return <Briefcase className={cls} />;
    case "Users":      return <Users className={cls} />;
    case "Scale":      return <Scale className={cls} />;
    case "TrendingUp": return <TrendingUp className={cls} />;
    case "DollarSign": return <DollarSign className={cls} />;
    default:           return <Scale className={cls} />;
  }
}

/* ─── Partner media hover player component ───────────────────────── */
function PartnerMedia({ image, video, name }: { image: string; video?: string; name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered && videoRef.current) {
      const playVideo = async () => {
        try {
          videoRef.current!.muted = false;
          videoRef.current!.currentTime = 0;
          await videoRef.current!.play();
        } catch (err) {
          console.log("Autoplay with sound blocked, trying muted:", err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            try {
              await videoRef.current.play();
            } catch (e) {
              console.error("Muted autoplay failed:", e);
            }
          }
        }
      };
      playVideo();
    }
  }, [hovered]);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  if (!video) {
    return (
      <img src={image} alt={name} className="w-full h-full object-cover team-card-img" />
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        src={image} 
        alt={name} 
        className="absolute inset-0 w-full h-full object-cover team-card-img" 
      />
      {hovered && (
        <video
          ref={videoRef}
          src={video}
          loop
          playsInline
          poster={image}
          className="absolute inset-0 w-full h-full object-cover team-card-img"
          style={{ pointerEvents: "none" }}
        />
      )}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen]         = useState(false);
  const [scrolled, setScrolled]                     = useState(false);
  const [activePracticeModal, setActivePracticeModal] = useState<string | null>(null);

  // Scheduler
  const [schedulerForm, setSchedulerForm] = useState({
    name: "", email: "", company: "", phone: "", summary: "",
    practice: "ip", date: "2026-06-15", time: "10:30 AM - 11:00 AM"
  });
  const [selectedDate, setSelectedDate]           = useState<number>(15);
  const [selectedTimeSlot, setSelectedTimeSlot]   = useState<string>("10:30 AM - 11:00 AM");
  const [schedulerSubmitting, setSchedulerSubmitting] = useState(false);
  const [schedulerSuccess, setSchedulerSuccess]   = useState(false);
  const [ticketModalOpen, setTicketModalOpen]     = useState(false);

  // Portal Demo
  const [portalUnlocked, setPortalUnlocked]       = useState(false);
  const [portalLoading, setPortalLoading]         = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(4);
  const [portalMessage, setPortalMessage]         = useState("");
  const [portalMessageSent, setPortalMessageSent] = useState(false);
  const [previewDoc, setPreviewDoc]               = useState<{ name: string; date: string; size: string } | null>(null);

  // Chatbot
  const [chatbotOpen, setChatbotOpen]   = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: websiteContent.chatbot.welcome }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Stats section in-view for counter animation
  const { ref: statsRef, inView: statsInView } = useInView(0.3);

  // Scroll detection for nav
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, botTyping]);

  /* ── Chatbot ── */
  const handleChatQuestionClick = (question: string, answer: string) => {
    setChatMessages(prev => [...prev, { sender: "user", text: question }]);
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatMessages(prev => [...prev, { sender: "bot", text: answer }]);
    }, 500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      const q = userText.toLowerCase();
      let response = `Thank you. For case inquiries, please request a consultation, or contact our Giza office at ${websiteContent.contact.phone}.`;
      if (q.includes("where") || q.includes("address") || q.includes("location")) {
        response = `Our offices are located at: ${websiteContent.contact.address}.`;
      } else if (q.includes("phone") || q.includes("contact") || q.includes("number")) {
        response = `You can call our corporate line at ${websiteContent.contact.phone}, or email ${websiteContent.contact.email}.`;
      } else if (q.includes("book") || q.includes("appointment") || q.includes("schedule")) {
        response = "Please scroll to the 'Schedule Consultation' section to select a date and book an online meeting.";
      } else if (q.includes("ip") || q.includes("trademark") || q.includes("brand")) {
        response = "Our IP and Brand Protection practice is led by Partner Hassane El Sheref and Managing Associate Omneya Moawad.";
      } else if (q.includes("corporate") || q.includes("labor")) {
        response = "Founding Partner Assem Al Hawy leads our Corporate and Labor practice.";
      } else if (q.includes("award") || q.includes("legal 500") || q.includes("ranking")) {
        response = "Shield Advocates is ranked by The Legal 500 and IP Stars, and won the 2023 MEA Business Awards.";
      }
      setChatMessages(prev => [...prev, { sender: "bot", text: response }]);
    }, 600);
  };

  /* ── Portal ── */
  const handleUnlockPortal = () => {
    setPortalLoading(true);
    setTimeout(() => { setPortalLoading(false); setPortalUnlocked(true); }, 800);
  };

  const handleSendPortalMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalMessage.trim()) return;
    setPortalMessageSent(true);
    setTimeout(() => { setPortalMessageSent(false); setPortalMessage(""); }, 2500);
  };

  /* ── Scheduler ── */
  const handleDateClick = (dayNum: number) => {
    setSelectedDate(dayNum);
    setSchedulerForm(prev => ({ ...prev, date: `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}` }));
  };
  const handleTimeSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot);
    setSchedulerForm(prev => ({ ...prev, time: slot }));
  };
  const handleSchedulerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerForm.name || !schedulerForm.email) return;
    setSchedulerSubmitting(true);
    setTimeout(() => { setSchedulerSubmitting(false); setSchedulerSuccess(true); setTicketModalOpen(true); }, 1000);
  };
  const handleResetScheduler = () => {
    setSchedulerForm({ name: "", email: "", company: "", phone: "", summary: "", practice: "ip", date: "2026-06-15", time: "10:30 AM - 11:00 AM" });
    setSelectedDate(15); setSelectedTimeSlot("10:30 AM - 11:00 AM"); setSchedulerSuccess(false);
  };

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen text-[#f4f4f5] antialiased overflow-x-hidden"
      style={{ background: "#080b12", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap');
        .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
        .gold { color: #C5A059; }
        .gold-text { background: linear-gradient(135deg, #e8c97a 0%, #C5A059 40%, #a07830 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gold-border { border-color: #C5A059; }
        .gold-bg { background: #C5A059; }
        .gold-bg-hover:hover { background: #C5A059; color: #08090f; }
        .section-divider { width: 48px; height: 2px; background: linear-gradient(90deg, #C5A059, transparent); margin-bottom: 1.5rem; }
        .card-hover { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .card-hover:hover { transform: translateY(-6px); border-color: rgba(197,160,89,0.5) !important; box-shadow: 0 24px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(197,160,89,0.15); }
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: #C5A059; transition: width 0.3s ease; }
        .nav-link:hover::after { width: 100%; }
        .hero-overlay { background: linear-gradient(105deg, rgba(8,11,18,0.97) 0%, rgba(8,11,18,0.88) 45%, rgba(8,11,18,0.55) 100%); }
        .hero-glow { background: radial-gradient(ellipse 60% 50% at 80% 50%, rgba(197,160,89,0.08) 0%, transparent 70%); }
        .shimmer-line { background: linear-gradient(90deg, transparent, rgba(197,160,89,0.3), transparent); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .practice-card { background: rgba(15,18,28,0.8); border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(8px); }
        .practice-card:hover { background: rgba(20,24,38,0.95); }
        .fade-in { animation: fadeIn 0.6s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .team-card-img { transition: transform 0.7s cubic-bezier(0.4,0,0.2,1); }
        .team-card:hover .team-card-img { transform: scale(1.04); }
        .gold-tag { background: rgba(197,160,89,0.1); border: 1px solid rgba(197,160,89,0.25); color: #C5A059; }
        .timeline-dot-active { box-shadow: 0 0 0 4px rgba(197,160,89,0.2), 0 0 12px rgba(197,160,89,0.4); }
        .chat-bubble-bot { background: rgba(20,25,40,0.95); border: 1px solid rgba(197,160,89,0.2); }
        .chat-bubble-user { background: #C5A059; color: #080b12; }
        .contact-input { background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #f4f4f5 !important; transition: border-color 0.3s; }
        .contact-input:focus { border-color: rgba(197,160,89,0.5) !important; outline: none !important; background: rgba(255,255,255,0.05) !important; }
        .award-card { background: rgba(15,18,28,0.7); border: 1px solid rgba(255,255,255,0.06); }
        .award-card:hover { border-color: rgba(197,160,89,0.35); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #080b12; } ::-webkit-scrollbar-thumb { background: rgba(197,160,89,0.3); border-radius: 4px; }
        .milestone-line { background: linear-gradient(180deg, rgba(197,160,89,0.6), rgba(197,160,89,0.1)); }
      `}</style>

      {/* ═══════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════ */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(8,11,18,0.98)" : "rgba(8,11,18,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(197,160,89,0.15)" : "1px solid rgba(255,255,255,0.04)",
          boxShadow: scrolled ? "0 8px 32px -8px rgba(0,0,0,0.8)" : "none"
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="#home" className="flex items-center gap-4 select-none group">
            <div className="w-10 h-10 shrink-0 overflow-hidden rounded" style={{ border: "1px solid rgba(197,160,89,0.4)" }}>
              <img src="/images/shield_logo.png" alt="Shield Advocates Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold tracking-[0.18em] text-[13px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                SHIELD ADVOCATES
              </span>
              <span className="text-[8px] tracking-[0.4em] mt-1 font-medium" style={{ color: "#C5A059", letterSpacing: "0.38em" }}>
                AL HAWY & HASSANE
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-9">
            {websiteContent.navigation.links.map(link => (
              <a key={link.name} href={link.href}
                className="nav-link text-[10.5px] uppercase tracking-[0.18em] font-semibold text-zinc-400 hover:text-white transition-colors duration-300">
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link href={websiteContent.navigation.ctaHref}
              className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded"
              style={{ background: "rgba(197,160,89,0.12)", border: "1px solid rgba(197,160,89,0.4)", color: "#C5A059" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "#C5A059"; (e.target as HTMLElement).style.color = "#080b12"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(197,160,89,0.12)"; (e.target as HTMLElement).style.color = "#C5A059"; }}>
              {websiteContent.navigation.cta}
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(p => !p)}
            className="lg:hidden text-zinc-400 hover:text-white transition-colors p-2">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 z-40 transition-transform duration-500 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#0c1018", borderLeft: "1px solid rgba(197,160,89,0.15)" }}>
        <div className="flex flex-col gap-6 p-8 pt-28">
          {websiteContent.navigation.links.map(link => (
            <a key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white font-semibold transition-colors">
              {link.name}
            </a>
          ))}
          <div className="h-px my-2" style={{ background: "rgba(197,160,89,0.2)" }} />
          <Link href={websiteContent.navigation.ctaHref} onClick={() => setMobileMenuOpen(false)}
            className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-center rounded transition-all"
            style={{ background: "rgba(197,160,89,0.12)", border: "1px solid rgba(197,160,89,0.4)", color: "#C5A059" }}>
            {websiteContent.navigation.cta}
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0">
          <img src="/images/hero_scales.png" alt="Shield Advocates"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.55) saturate(0.85)" }} />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 hero-glow" />
          {/* Subtle animated shimmer */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="shimmer-line absolute top-0 left-0 right-0 h-px" />
          </div>
        </div>

        {/* Fine grid overlay */}
        <div className="absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: "linear-gradient(rgba(197,160,89,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,0.06) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full pt-28 pb-24">
          <div className="max-w-3xl">
            {/* Eyebrow label */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 gold-bg" />
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: "#C5A059" }}>
                {websiteContent.hero.tagline}
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-playfair font-bold leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", color: "#f5f0e8" }}>
              {websiteContent.hero.titleFirst}<br />
              <span className="gold-text italic">{websiteContent.hero.titleSecond}</span>
            </h1>

            <p className="text-zinc-300 font-light leading-relaxed mb-10 max-w-xl"
              style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)" }}>
              {websiteContent.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#scheduler"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded font-bold text-[11px] uppercase tracking-widest transition-all duration-300"
                style={{ background: "#C5A059", color: "#080b12" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#d4b06a")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C5A059")}>
                {websiteContent.hero.ctaBook}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#practices"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded font-bold text-[11px] uppercase tracking-widest text-zinc-200 hover:text-white transition-all duration-300"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.5)"; (e.currentTarget as HTMLElement).style.color = "#C5A059"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "#e4e4e7"; }}>
                Our Expertise
              </a>
              <a href="#portal-demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded font-bold text-[11px] uppercase tracking-widest text-zinc-300 hover:text-white transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}>
                {websiteContent.hero.ctaPortal}
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-14 pt-8"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {[{ label: "Legal 500", sub: "Top Ranked" }, { label: "IP STARS", sub: "Recommended" }, { label: "MEA Awards", sub: "Winner 2023" }].map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "#C5A059" }} />
                  <div>
                    <p className="text-white text-xs font-bold">{b.label}</p>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: "#C5A059" }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[8px] uppercase tracking-[0.35em] text-zinc-400">Scroll</span>
          <ChevronDown className="w-4 h-4 text-zinc-400 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TICKER BAR
      ═══════════════════════════════════════════ */}
      <div className="py-3 overflow-hidden" style={{ background: "#C5A059" }}>
        <div className="flex items-center gap-10 whitespace-nowrap animate-marquee-infinite"
          style={{ animationDuration: "20s" }}>
          {Array(4).fill(["The Legal 500 — Ranked Firm", "IP STARS — Highly Recommended", "MEA Business Awards 2023", "Sheikh Zayed, Giza, Egypt", "INTA Member Firm", "Egypt & MENA Region"]).flat().map((item, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-[#080b12] flex items-center gap-4">
              {item}
              <span className="w-1 h-1 rounded-full bg-[#080b12] opacity-50" />
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          .animate-marquee-infinite { animation: marquee 20s linear infinite; display:flex; }
        `}</style>
      </div>

      {/* ═══════════════════════════════════════════
          ABOUT SECTION
      ═══════════════════════════════════════════ */}
      <section id="about" className="py-32 px-6 lg:px-10 relative" style={{ background: "#080b12" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left — Image */}
            <div className="relative group">
              {/* Gold frame offset */}
              <div className="absolute -top-4 -left-4 w-full h-full rounded"
                style={{ border: "1px solid rgba(197,160,89,0.25)" }} />
              <div className="relative rounded overflow-hidden shadow-2xl">
                <img src="/images/about_library.png" alt="Shield Advocates Legal Library"
                  className="w-full h-[480px] object-cover team-card-img"
                  style={{ filter: "brightness(0.9) saturate(0.9)" }} />
                {/* Corner badge */}
                <div className="absolute bottom-6 left-6 right-6 rounded p-5 text-left"
                  style={{ background: "rgba(8,11,18,0.95)", border: "1px solid rgba(197,160,89,0.25)", backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                      style={{ background: "rgba(197,160,89,0.12)", border: "1px solid rgba(197,160,89,0.3)" }}>
                      <Scale className="w-5 h-5" style={{ color: "#C5A059" }} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Established 2020</p>
                      <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#C5A059" }}>Sheikh Zayed City, Giza, Egypt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Content */}
            <div className="space-y-8">
              <div>
                <div className="section-divider" />
                <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
                  {websiteContent.about.tagline}
                </span>
                <h2 className="font-playfair font-bold leading-tight text-white"
                  style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
                  {websiteContent.about.title}
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-zinc-400 leading-relaxed font-light text-sm">{websiteContent.about.description1}</p>
                <p className="text-zinc-400 leading-relaxed font-light text-sm">{websiteContent.about.description2}</p>
              </div>

              {/* Stats */}
              <div ref={statsRef} className="grid grid-cols-2 gap-6 pt-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { value: "2020", label: "Established" },
                  { value: "Legal 500", label: "Top-Ranked Practice" },
                  { value: "20+", label: "Years Lead Partner Exp." },
                  { value: "100%", label: "Business Transparency" }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="font-playfair font-bold block" style={{ fontSize: "1.75rem", color: "#C5A059" }}>
                      {stat.value}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold block">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <a href="#practices"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold transition-colors group/link"
                style={{ color: "#C5A059" }}>
                Explore Our Expertise
                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          RECOGNITION & AWARDS
      ═══════════════════════════════════════════ */}
      <section id="recognition" className="py-28 px-6 lg:px-10 relative"
        style={{ background: "linear-gradient(180deg, #0c1018 0%, #080b12 100%)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <div className="section-divider mx-auto" style={{ margin: "0 auto 1.5rem" }} />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
              {websiteContent.recognition.tagline}
            </span>
            <h2 className="font-playfair font-bold text-white" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              {websiteContent.recognition.title}
            </h2>
            <p className="text-zinc-400 font-light text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              {websiteContent.recognition.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {websiteContent.recognition.awards.map((award, idx) => (
              <div key={idx} className="award-card card-hover p-7 rounded text-left transition-all duration-400">
                <div className="w-10 h-10 rounded flex items-center justify-center mb-6"
                  style={{ background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.25)" }}>
                  <Award className="w-5 h-5" style={{ color: "#C5A059" }} />
                </div>
                <h3 className="font-playfair font-bold text-white text-lg mb-1">{award.title}</h3>
                <span className="text-[9px] uppercase tracking-widest font-semibold block mb-4" style={{ color: "#C5A059" }}>
                  {award.institution}
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">{award.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRACTICE AREAS
      ═══════════════════════════════════════════ */}
      <section id="practices" className="py-32 px-6 lg:px-10 relative" style={{ background: "#080b12" }}>
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
            <div>
              <div className="section-divider" />
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
                {websiteContent.practices.tagline}
              </span>
              <h2 className="font-playfair font-bold text-white" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
                {websiteContent.practices.title}
              </h2>
            </div>
            <p className="text-zinc-400 font-light text-sm leading-relaxed max-w-sm">
              {websiteContent.practices.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {websiteContent.practices.list.map(practice => (
              <div key={practice.id}
                className="practice-card card-hover p-8 rounded flex flex-col justify-between group cursor-pointer"
                onClick={() => setActivePracticeModal(practice.id)}>
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded flex items-center justify-center"
                    style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.2)" }}>
                    <PracticeIcon name={practice.icon} />
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-white text-[1.1rem] mb-2 group-hover:text-[#e8c97a] transition-colors">
                      {practice.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed">{practice.shortDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-8 pt-6"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#C5A059" }}>
                    Read More
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" style={{ color: "#C5A059" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Modal */}
      {activePracticeModal && (() => {
        const item = websiteContent.practices.list.find(p => p.id === activePracticeModal);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 fade-in"
            style={{ background: "rgba(4,6,10,0.92)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setActivePracticeModal(null); }}>
            <div className="relative rounded p-8 max-w-lg w-full shadow-2xl text-left"
              style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.25)" }}>
              <button onClick={() => setActivePracticeModal(null)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-6 pb-5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded flex items-center justify-center shrink-0"
                  style={{ background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.25)" }}>
                  <PracticeIcon name={item.icon} />
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-widest block mb-1" style={{ color: "#C5A059" }}>
                    Shield Advocates Division
                  </span>
                  <h3 className="font-playfair font-bold text-white text-xl">{item.title}</h3>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-light mb-6">{item.longDesc}</p>
              <div className="flex items-center justify-between gap-4 pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[10px] text-zinc-500">{websiteContent.contact.phone}</span>
                <a href="#scheduler"
                  onClick={() => { setSchedulerForm(p => ({ ...p, practice: item.id })); setActivePracticeModal(null); }}
                  className="px-6 py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                  style={{ background: "#C5A059", color: "#080b12" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#d4b06a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#C5A059")}>
                  Book Appointment
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════
          TEAM SECTION
      ═══════════════════════════════════════════ */}
      <section id="team" className="py-32 px-6 lg:px-10 relative"
        style={{ background: "#0c1018", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <div className="section-divider mx-auto" style={{ margin: "0 auto 1.5rem" }} />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
              {websiteContent.team.tagline}
            </span>
            <h2 className="font-playfair font-bold text-white" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              {websiteContent.team.title}
            </h2>
            <p className="text-zinc-400 font-light text-sm mt-3 max-w-xl mx-auto">
              {websiteContent.team.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {websiteContent.team.members.map((member, idx) => (
              <div key={idx} className="team-card rounded overflow-hidden group transition-all duration-400"
                style={{ background: "rgba(12,15,25,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.35)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 48px -12px rgba(0,0,0,0.8)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>

                {/* Portrait */}
                <div className="relative h-80 overflow-hidden">
                  <PartnerMedia image={member.image} video={member.video} name={member.name} />
                  {/* Gold bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                    style={{ background: "linear-gradient(transparent, rgba(8,11,18,0.9))" }} />
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-playfair font-bold text-white text-xl">{member.name}</h3>
                    <p className="text-[9px] uppercase tracking-widest mt-1 font-semibold" style={{ color: "#C5A059" }}>
                      {member.role}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{member.bio}</p>

                  <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold block mb-2">
                      SPECIALIZATION
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.focus.map((f, i) => (
                        <span key={i} className="gold-tag text-[8px] px-2.5 py-1 rounded font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PORTAL DEMO
      ═══════════════════════════════════════════ */}
      <section id="portal-demo" className="py-32 px-6 lg:px-10 relative"
        style={{ background: "#080b12", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">

          <div className="mb-16">
            <div className="section-divider" />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
              CLIENT WORKSPACE DEMO
            </span>
            <h2 className="font-playfair font-bold text-white mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              {websiteContent.portalDemo.title}
            </h2>
            <p className="text-zinc-400 font-light text-sm leading-relaxed max-w-2xl">
              {websiteContent.portalDemo.subtitle}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {!portalUnlocked ? (
              <div className="rounded p-14 text-center space-y-6 shadow-2xl"
                style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.2)" }}>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.3)" }}>
                    <Lock className="w-7 h-7" style={{ color: "#C5A059" }} />
                  </div>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="font-playfair font-bold text-white text-xl">Client Case Tracker Workspace</h3>
                  <p className="text-sm text-zinc-400 font-light leading-relaxed">
                    Initialize the demo client environment to view the active IP opposition file for{" "}
                    <strong className="text-white">Global Tech Solutions Inc.</strong>
                  </p>
                </div>
                <button onClick={handleUnlockPortal} disabled={portalLoading}
                  className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded font-bold text-[11px] uppercase tracking-widest transition-all"
                  style={{ background: "#C5A059", color: "#080b12" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#d4b06a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#C5A059")}>
                  {portalLoading ? (
                    <><span className="w-4 h-4 border-2 border-[#080b12] border-t-transparent rounded-full animate-spin" />Connecting...</>
                  ) : "Connect to Case Demo"}
                </button>
              </div>
            ) : (
              <div className="rounded overflow-hidden shadow-2xl flex flex-col md:flex-row fade-in"
                style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.2)" }}>

                {/* Side panel */}
                <div className="w-full md:w-72 p-7 flex flex-col justify-between"
                  style={{ background: "#0a0e1a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-4"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold">Matter Workspace</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34d399" }} />
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">CLIENT</span>
                      <p className="text-xs font-semibold text-white">{websiteContent.portalDemo.clientName}</p>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">MATTER</span>
                      <p className="text-xs font-medium text-zinc-300 leading-normal">{websiteContent.portalDemo.matterName}</p>
                    </div>
                    <div className="space-y-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {[
                        { label: "File No:", value: websiteContent.portalDemo.caseNumber },
                        { label: "Court:", value: websiteContent.portalDemo.courtName.split(",")[0] },
                        { label: "Attorneys:", value: "Hassane, Omneya" }
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">{r.label}</span>
                          <span className="text-zinc-300 font-mono text-right max-w-[120px] truncate">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 mt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[8px] text-zinc-600 font-mono block mb-2">SHIELD ADVOCATES SECURE ENV.</span>
                    <button onClick={() => setPortalUnlocked(false)}
                      className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                      Disconnect Demo
                    </button>
                  </div>
                </div>

                {/* Main panel */}
                <div className="flex-1 p-7 space-y-7">
                  <div className="p-4 rounded flex items-center justify-between gap-4"
                    style={{ background: "rgba(197,160,89,0.06)", border: "1px solid rgba(197,160,89,0.2)" }}>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold block mb-0.5">CURRENT STATUS</span>
                      <p className="text-sm font-semibold text-white">{websiteContent.portalDemo.currentStatus}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wide"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                      Active
                    </span>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-5">Case Progression Milestones</h3>
                    <div className="relative pl-6 space-y-5" style={{ borderLeft: "1px solid rgba(197,160,89,0.2)" }}>
                      {websiteContent.portalDemo.milestones.map((m, idx) => {
                        const isSelected = selectedMilestone === idx;
                        const isCompleted = m.status === "completed";
                        return (
                          <div key={idx} onClick={() => setSelectedMilestone(idx)} className="relative cursor-pointer group">
                            <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                              isCompleted ? "border-[#C5A059] bg-[#C5A059] timeline-dot-active" : "bg-[#0e1320] border-zinc-700 group-hover:border-[#C5A059]"
                            }`} />
                            <div>
                              <span className={`text-xs font-medium block transition-colors ${isSelected ? "text-[#e8c97a]" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                                {m.title}
                              </span>
                              <span className="text-[9px] text-zinc-600 block font-mono mt-0.5">{m.date}</span>
                            </div>
                            {isSelected && (
                              <div className="mt-2 p-3 rounded text-xs text-zinc-400 leading-relaxed font-light"
                                style={{ background: "rgba(197,160,89,0.05)", border: "1px solid rgba(197,160,89,0.15)" }}>
                                {idx === 0 && "Verification of GAFI registers and corporate authorization completed."}
                                {idx === 1 && "Cease and desist brief finalized by Partner Hassane El Sheref and served to counterparty."}
                                {idx === 2 && "Opposition brief lodged at the Egyptian Trademark Registry by Omneya Moawad."}
                                {idx === 3 && "First litigation hearing held before Cairo Economic Court. Oral pleas filed by senior partners."}
                                {idx === 4 && "Final written defense briefs and evidence logs submitted to Giza Economic Court (Today)."}
                                {idx === 5 && "Verdict session and enforcement files scheduled. Legal team monitoring developments daily."}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 className="font-semibold text-white text-sm mb-4">Secure Pleading Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {websiteContent.portalDemo.documents.map((doc, idx) => (
                        <div key={idx} onClick={() => setPreviewDoc(doc)}
                          className="p-4 rounded cursor-pointer transition-all flex items-center gap-3 group"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.3)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                          <FileText className="w-5 h-5 shrink-0" style={{ color: "#C5A059" }} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-white truncate">{doc.name}</p>
                            <span className="text-[9px] text-zinc-500 font-mono">{doc.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 className="font-semibold text-white text-sm mb-4">Message Legal Team</h3>
                    <form onSubmit={handleSendPortalMessage} className="flex gap-3">
                      <input type="text" placeholder="Write a message to Hassane or Omneya..."
                        value={portalMessage} onChange={e => setPortalMessage(e.target.value)}
                        className="flex-1 contact-input text-xs rounded px-4 py-2.5" />
                      <button type="submit"
                        className="px-5 rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                        style={{ background: "#C5A059", color: "#080b12", border: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#d4b06a")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#C5A059")}>
                        Send
                      </button>
                    </form>
                    {portalMessageSent && (
                      <p className="text-xs text-emerald-400 flex items-center gap-2 mt-2">
                        <Check className="w-3.5 h-3.5" /> Message sent to attorney workstation.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 fade-in"
          style={{ background: "rgba(4,6,10,0.92)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null); }}>
          <div className="relative bg-white text-zinc-800 rounded p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto text-left"
            style={{ fontFamily: "Georgia, serif" }}>
            <button onClick={() => setPreviewDoc(null)} className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1 pb-5 mb-5" style={{ borderBottom: "2px solid #1a1a2e" }}>
              <span className="text-[9px] tracking-[0.25em] font-sans font-bold uppercase text-zinc-400 block">
                ARAB REPUBLIC OF EGYPT — ECONOMIC JURISDICTION
              </span>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight font-sans">SHIELD ADVOCATES</h2>
              <span className="text-[9px] font-sans block text-zinc-500 font-semibold">AL HAWY & HASSANE LAW FIRM</span>
              <p className="text-[10px] font-sans text-zinc-500">Sheikh Zayed | Karma 1, Giza | {websiteContent.contact.phone}</p>
            </div>
            <div className="py-6 space-y-4 text-xs text-zinc-700 leading-relaxed">
              <div className="flex justify-between font-sans text-[9px] font-semibold text-zinc-400">
                <span>FILE: {previewDoc.name}</span><span>DATE: {previewDoc.date}</span>
              </div>
              <p className="font-bold text-zinc-900 font-sans">RE: INTELLECTUAL PROPERTY PROTECTION & INFRINGEMENT INJUNCTION</p>
              <p className="font-sans text-[10px] text-zinc-500">CASE REF: {websiteContent.portalDemo.caseNumber}</p>
              <p>Pursuant to Egyptian Intellectual Property Law No. 82 of 2002, our IP division led by Partner Hassane El Sheref and Managing Associate Omneya Moawad has formalised the opposition filings.</p>
              <p>The opposition asserts that the counterparty's trademark applications overlap with our client's internationally registered trademark rights. Customs border protection records have been filed with the Ministry of Finance to execute seizures of unauthorized goods.</p>
              <p className="italic text-zinc-500 text-[11px]">This is a privileged work product document subject to client-attorney secrecy protocols.</p>
            </div>
            <div className="pt-5 flex justify-between items-center" style={{ borderTop: "1px solid #e5e7eb" }}>
              <div>
                <span className="text-[9px] text-zinc-400 block">AUTHORIZED INTA MEMBER</span>
                <span className="text-sm font-bold text-zinc-800">Hassane El Sheref</span>
                <span className="text-[9px] text-zinc-500 block">Senior Partner, Head of IP</span>
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-dashed border-red-400 flex items-center justify-center -rotate-12">
                <span className="text-[7px] font-bold text-red-500 text-center uppercase tracking-widest leading-none">SHIELD<br/>OFFICIAL<br/>SEAL</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => window.print()} className="bg-zinc-800 hover:bg-zinc-900 text-white font-sans text-xs font-bold py-2 px-5 rounded transition-colors">
                Print Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          SCHEDULER
      ═══════════════════════════════════════════ */}
      <section id="scheduler" className="py-32 px-6 lg:px-10 relative"
        style={{ background: "#0c1018", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="section-divider" />
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
              DIRECT RESERVATION
            </span>
            <h2 className="font-playfair font-bold text-white mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              {websiteContent.scheduler.title}
            </h2>
            <p className="text-zinc-400 font-light text-sm leading-relaxed max-w-xl">
              {websiteContent.scheduler.subtitle}
            </p>
          </div>

          {schedulerSuccess ? (
            <div className="max-w-lg mx-auto text-center py-16 fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="font-playfair font-bold text-white text-2xl mb-3">{websiteContent.scheduler.form.successTitle}</h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed mb-8">{websiteContent.scheduler.form.successDesc}</p>
              <button onClick={handleResetScheduler}
                className="px-8 py-3 rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                style={{ background: "rgba(197,160,89,0.1)", border: "1px solid rgba(197,160,89,0.4)", color: "#C5A059" }}>
                Book Another
              </button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto rounded overflow-hidden flex flex-col md:flex-row"
              style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.2)" }}>

              {/* Calendar panel */}
              <div className="w-full md:w-80 p-8 flex flex-col space-y-6"
                style={{ background: "#0a0e1a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-playfair font-semibold text-white">June 2026</h3>
                  <div className="flex gap-2">
                    <ChevronLeft className="w-4 h-4 text-zinc-600 cursor-not-allowed" />
                    <ChevronRight className="w-4 h-4 text-zinc-600 cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
                  {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(d => (
                    <span key={d} className="text-zinc-500 font-bold py-1">{d}</span>
                  ))}
                  <span />
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                    const isWeekend = (day % 7 === 5 || day % 7 === 6);
                    const isPast = day < 8;
                    const isSelected = selectedDate === day;
                    const isAvailable = !isWeekend && !isPast;
                    return (
                      <button key={day}
                        onClick={() => isAvailable && handleDateClick(day)}
                        disabled={!isAvailable}
                        className="py-1.5 rounded text-[11px] font-semibold transition-all"
                        style={{
                          background: isSelected ? "#C5A059" : "transparent",
                          color: isSelected ? "#080b12" : isAvailable ? "#e4e4e7" : "#3f3f46",
                          cursor: isAvailable ? "pointer" : "default",
                          border: isSelected ? "none" : isAvailable ? "1px solid transparent" : "none"
                        }}
                        onMouseEnter={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(197,160,89,0.15)"; }}
                        onMouseLeave={e => { if (isAvailable && !isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block">Available Times</span>
                  {websiteContent.scheduler.timeSlots.map(slot => (
                    <button key={slot} onClick={() => handleTimeSlotClick(slot)}
                      className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all"
                      style={{
                        background: selectedTimeSlot === slot ? "rgba(197,160,89,0.15)" : "rgba(255,255,255,0.02)",
                        border: selectedTimeSlot === slot ? "1px solid rgba(197,160,89,0.4)" : "1px solid rgba(255,255,255,0.05)",
                        color: selectedTimeSlot === slot ? "#C5A059" : "#a1a1aa"
                      }}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form panel */}
              <form onSubmit={handleSchedulerSubmit} className="flex-1 p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: websiteContent.scheduler.form.name, type: "text", req: true },
                    { key: "email", label: websiteContent.scheduler.form.email, type: "email", req: true },
                    { key: "company", label: websiteContent.scheduler.form.company, type: "text", req: false },
                    { key: "phone", label: websiteContent.scheduler.form.phone, type: "tel", req: false }
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                        {field.label}{field.req && <span style={{ color: "#C5A059" }}> *</span>}
                      </label>
                      <input type={field.type}
                        value={schedulerForm[field.key as keyof typeof schedulerForm]}
                        onChange={e => setSchedulerForm(p => ({ ...p, [field.key]: e.target.value }))}
                        required={field.req}
                        className="contact-input w-full text-sm rounded px-4 py-2.5 focus:outline-none" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                    {websiteContent.scheduler.form.practice}
                  </label>
                  <select value={schedulerForm.practice}
                    onChange={e => setSchedulerForm(p => ({ ...p, practice: e.target.value }))}
                    className="contact-input w-full text-sm rounded px-4 py-2.5 focus:outline-none"
                    style={{ appearance: "none" }}>
                    {websiteContent.practices.list.map(p => (
                      <option key={p.id} value={p.id} style={{ background: "#0e1320" }}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                    {websiteContent.scheduler.form.summary}
                  </label>
                  <textarea rows={4} placeholder="Briefly describe your legal inquiry..."
                    value={schedulerForm.summary}
                    onChange={e => setSchedulerForm(p => ({ ...p, summary: e.target.value }))}
                    className="contact-input w-full text-sm rounded px-4 py-2.5 focus:outline-none resize-none" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-zinc-500">
                    <span style={{ color: "#C5A059" }}>{selectedDate} Jun 2026</span> · {selectedTimeSlot}
                  </div>
                  <button type="submit" disabled={schedulerSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                    style={{ background: "#C5A059", color: "#080b12", border: "none" }}
                    onMouseEnter={e => !schedulerSubmitting && ((e.currentTarget as HTMLElement).style.background = "#d4b06a")}
                    onMouseLeave={e => !schedulerSubmitting && ((e.currentTarget as HTMLElement).style.background = "#C5A059")}>
                    {schedulerSubmitting ? (
                      <><span className="w-4 h-4 border-2 border-[#080b12] border-t-transparent rounded-full animate-spin" />Sending...</>
                    ) : <>{websiteContent.scheduler.form.btn}<ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT SECTION
      ═══════════════════════════════════════════ */}
      <section id="contact" className="py-32 px-6 lg:px-10 relative"
        style={{ background: "#080b12", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left */}
            <div>
              <div className="section-divider" />
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold block mb-4" style={{ color: "#C5A059" }}>
                GET IN TOUCH
              </span>
              <h2 className="font-playfair font-bold text-white mb-6" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
                {websiteContent.contact.title}
              </h2>
              <p className="text-zinc-400 font-light text-sm leading-relaxed mb-10">
                {websiteContent.contact.subtitle}
              </p>

              <div className="space-y-6">
                {[
                  { icon: <MapPin className="w-5 h-5" />, label: "Office Address", value: websiteContent.contact.address },
                  { icon: <Phone className="w-5 h-5" />, label: "Phone / WhatsApp", value: websiteContent.contact.phone },
                  { icon: <Mail className="w-5 h-5" />, label: "Email", value: websiteContent.contact.email },
                  { icon: <Calendar className="w-5 h-5" />, label: "Office Hours", value: websiteContent.contact.workingHours }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.2)" }}>
                      <span style={{ color: "#C5A059" }}>{item.icon}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-0.5">{item.label}</span>
                      <p className="text-sm text-zinc-300 font-light">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Contact form */}
            <div className="rounded p-8 space-y-5"
              style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.2)" }}>
              <h3 className="font-playfair font-semibold text-white text-xl mb-1">{websiteContent.contact.form.title}</h3>
              <div className="h-px mb-5" style={{ background: "rgba(197,160,89,0.15)" }} />
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); }}>
                {[
                  { label: "Full Name", type: "text", ph: "Your name" },
                  { label: "Email Address", type: "email", ph: "your@company.com" },
                  { label: "Phone Number", type: "tel", ph: "+20 ..." }
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.ph}
                      className="contact-input w-full text-sm rounded px-4 py-2.5 focus:outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">Message</label>
                  <textarea rows={4} placeholder="Describe your legal inquiry..."
                    className="contact-input w-full text-sm rounded px-4 py-2.5 focus:outline-none resize-none" />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded font-bold text-[11px] uppercase tracking-widest transition-all mt-2"
                  style={{ background: "#C5A059", color: "#080b12", border: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#d4b06a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#C5A059")}>
                  {websiteContent.contact.form.btn}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer style={{ background: "#050810", borderTop: "1px solid rgba(197,160,89,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Link href="#home" className="flex items-center gap-3 select-none">
              <div className="w-8 h-8 rounded overflow-hidden" style={{ border: "1px solid rgba(197,160,89,0.3)" }}>
                <img src="/images/shield_logo.png" alt="Shield Advocates" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold tracking-[0.18em] text-[12px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  SHIELD ADVOCATES
                </span>
                <span className="text-[7px] tracking-[0.4em] mt-0.5 font-medium" style={{ color: "#C5A059" }}>
                  AL HAWY & HASSANE
                </span>
              </div>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
              {websiteContent.navigation.links.map(link => (
                <a key={link.name} href={link.href}
                  className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors font-semibold">
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Contact */}
            <div className="flex items-center gap-4">
              <a href={`tel:${websiteContent.contact.phone.replace(/[^+\d]/g, "")}`}
                className="w-9 h-9 rounded flex items-center justify-center transition-all"
                style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.2)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.5)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.2)"}>
                <Phone className="w-4 h-4" style={{ color: "#C5A059" }} />
              </a>
              <a href="mailto:info@shieldadvocates.com"
                className="w-9 h-9 rounded flex items-center justify-center transition-all"
                style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.2)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.5)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(197,160,89,0.2)"}>
                <Mail className="w-4 h-4" style={{ color: "#C5A059" }} />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
              {websiteContent.footer.legalNotice}
            </p>
            <Link href="/login"
              className="text-[9px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors"
              style={{ color: "#C5A059" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#e8c97a"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#C5A059"}>
              Staff Portal →
            </Link>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          FLOATING CHATBOT
      ═══════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat window */}
        {chatbotOpen && (
          <div className="mb-4 w-80 rounded-2xl overflow-hidden shadow-2xl fade-in"
            style={{ background: "#0e1320", border: "1px solid rgba(197,160,89,0.3)" }}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #0a0e1a, #141828)", borderBottom: "1px solid rgba(197,160,89,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(197,160,89,0.15)", border: "1px solid rgba(197,160,89,0.35)" }}>
                  <Shield className="w-4 h-4" style={{ color: "#C5A059" }} />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Shield AI</p>
                  <p className="text-[9px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Online
                  </p>
                </div>
              </div>
              <button onClick={() => setChatbotOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === "bot" ? "chat-bubble-bot text-zinc-300" : "chat-bubble-user font-semibold"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {botTyping && (
                <div className="flex justify-start">
                  <div className="chat-bubble-bot px-4 py-3 rounded-xl flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {websiteContent.chatbot.faq.slice(0, 2).map((faq, i) => (
                <button key={i}
                  onClick={() => handleChatQuestionClick(faq.question, faq.answer)}
                  className="text-[9px] px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{ background: "rgba(197,160,89,0.08)", border: "1px solid rgba(197,160,89,0.25)", color: "#C5A059" }}>
                  {faq.question}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <input type="text" placeholder={websiteContent.chatbot.placeholder}
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                className="flex-1 contact-input text-xs rounded-lg px-3 py-2 focus:outline-none" />
              <button type="submit"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                style={{ background: "#C5A059" }}>
                <Send className="w-3.5 h-3.5" style={{ color: "#080b12" }} />
              </button>
            </form>
          </div>
        )}

        {/* Toggle button */}
        <button onClick={() => setChatbotOpen(p => !p)}
          className="ml-auto flex w-14 h-14 rounded-full items-center justify-center shadow-2xl transition-all duration-300"
          style={{
            background: chatbotOpen ? "#1a1f30" : "#C5A059",
            border: "2px solid rgba(197,160,89,0.5)",
            boxShadow: "0 8px 32px -8px rgba(197,160,89,0.4)"
          }}
          onMouseEnter={e => { if (!chatbotOpen) (e.currentTarget as HTMLElement).style.background = "#d4b06a"; }}
          onMouseLeave={e => { if (!chatbotOpen) (e.currentTarget as HTMLElement).style.background = "#C5A059"; }}>
          {chatbotOpen
            ? <X className="w-5 h-5 text-zinc-300" />
            : <MessageSquare className="w-5 h-5" style={{ color: "#080b12" }} />}
        </button>
      </div>

    </div>
  );
}