"use client";
import { Scale, Building2, Gavel, Lightbulb, ArrowLeft } from "lucide-react";
import type { TaskCategory } from "./types";

const CARDS = [
  {
    key: "GENERAL" as TaskCategory,
    label: "General",
    desc: "General tasks with basic fields",
    icon: Scale,
    gradient: "from-amber-500/20 to-amber-700/5",
    border: "hover:border-amber-500/40",
    iconColor: "text-amber-400",
  },
  {
    key: "CORPORATE" as TaskCategory,
    label: "Corporate",
    desc: "Corporate legal matters",
    icon: Building2,
    gradient: "from-emerald-500/20 to-emerald-700/5",
    border: "hover:border-emerald-500/40",
    iconColor: "text-emerald-400",
  },
  {
    key: "LITIGATION" as TaskCategory,
    label: "Litigation",
    desc: "IP & Corporate litigation cases",
    icon: Gavel,
    gradient: "from-rose-500/20 to-rose-700/5",
    border: "hover:border-rose-500/40",
    iconColor: "text-rose-400",
  },
  {
    key: "IP" as TaskCategory,
    label: "Intellectual Property",
    desc: "Trademarks, Patents, Copyrights & more",
    icon: Lightbulb,
    gradient: "from-violet-500/20 to-violet-700/5",
    border: "hover:border-violet-500/40",
    iconColor: "text-violet-400",
  },
];

interface Props {
  onSelect: (cat: TaskCategory) => void;
  taskCounts: Record<string, number>;
}

export default function TaskLanding({ onSelect, taskCounts }: Props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-serif font-bold mb-10 text-center">Matters</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
        {CARDS.map(({ key, label, desc, icon: Icon, gradient, border, iconColor }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`group relative legal-card p-8 text-left transition-all duration-500 ${border}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-7 h-7 ${iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold mb-1">{label}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{taskCounts[key] || 0}</span>
                <span className="text-slate-500 text-xs">matters</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm">Back to {label}</span>
    </button>
  );
}
