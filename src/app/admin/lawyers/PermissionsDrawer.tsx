"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X, Shield, Check, Loader2 } from "lucide-react";

interface Permission {
  code: string;
  name: string;
}

interface Props {
  lawyerId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function PermissionsDrawer({ lawyerId, open, onClose }: Props) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // fetch all perms once
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const list: Permission[] = await res.json();
          setAllPermissions(list.filter(p => !/^\d+$/.test(p.code)));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [open]);

  // fetch user perms when lawyerId changes
  useEffect(() => {
    if (!open || !lawyerId) return;
    setFetching(true);
    (async () => {
      try {
        const res = await fetch(`/api/users/${lawyerId}/permissions`);
        if (res.ok) {
          const list: Array<{ code: string; allowed: boolean }> = await res.json();
          const obj: Record<string, boolean> = {};
          list.forEach((p) => {
            if (p.allowed) obj[p.code] = true;
          });
          setChecked(obj);
        } else {
          setChecked({});
        }
      } catch (err) {
        setChecked({});
      } finally {
        setFetching(false);
      }
    })();
  }, [lawyerId, open]);

  const toggle = (code: string) => {
    if (/^\d+$/.test(code)) return; // ignore numeric placeholder codes
    setChecked((p) => ({ ...p, [code]: !p[code] }));
  };

  const save = async () => {
    if (!lawyerId) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`/api/users/${lawyerId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          permissions: Object.fromEntries(
            Object.entries(checked).filter(([k]) => !/^\d+$/.test(k))
          ),
        }),
      });
      setLoading(false);
      if (res.ok) {
        toast.success("User permissions updated successfully!");
        onClose();
      } else {
        let errMsg = "Failed to update permissions";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch (_) {}
        toast.error(errMsg);
      }
    } catch (err) {
      setLoading(false);
      toast.error("Network error");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0b101d] w-full max-w-md h-full p-8 overflow-y-auto shadow-2xl border-l border-white/10 flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#C5A059]" /> Explicit Permissions
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                Configure features for User ID: {lawyerId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 pr-2 custom-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto">
              {allPermissions.map((perm) => {
                const isActive = !!checked[perm.code];
                return (
                  <label
                    key={perm.code}
                    onClick={() => toggle(perm.code)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      isActive
                        ? "bg-[#C5A059]/5 border-[#C5A059]/30 text-white shadow-inner"
                        : "bg-[#070b13] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold tracking-wide uppercase">
                        {perm.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {perm.code}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                        isActive
                          ? "bg-[#C5A059] border-[#C5A059] text-slate-900"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </label>
                );
              })}
              {allPermissions.length === 0 && (
                <p className="text-center text-slate-500 text-xs py-10">
                  No explicit permissions loaded from system.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center gap-2 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Permissions"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
