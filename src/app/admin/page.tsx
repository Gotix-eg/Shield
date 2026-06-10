"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/website");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
      <div className="animate-pulse text-[#C5A059] text-sm font-medium tracking-widest uppercase">
        Redirecting to Dashboard...
      </div>
    </div>
  );
}
