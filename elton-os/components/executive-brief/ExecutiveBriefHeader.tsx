"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function ExecutiveBriefHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl transition-all" style={{
      borderColor: "rgba(16,56,38,0.1)",
      background: "rgba(250,246,239,0.92)",
    }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/prsto" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          <Image
            src="/branding/logo-prsto.png"
            alt="PRSTO"
            width={140}
            height={44}
            style={{ objectFit: "contain" }}
          />
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-md" style={{
            background: "rgba(228,177,24,0.15)", color: "#E4B118",
          }}>
            Executive Brief
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#contenu" className="text-[13px] font-medium transition-colors" style={{ color: "#50625A", textDecoration: "none" }}>
            Contenu
          </a>
          <a href="#comparaison" className="text-[13px] font-medium transition-colors" style={{ color: "#50625A", textDecoration: "none" }}>
            Comparaison
          </a>
          <a href="#faq" className="text-[13px] font-medium transition-colors" style={{ color: "#50625A", textDecoration: "none" }}>
            FAQ
          </a>
          <a href="#commander" className="px-5 py-2 rounded-xl text-[13px] font-semibold transition-all" style={{
            background: "#E4B118", color: "#082E1E",
            textDecoration: "none",
          }}>
            Commander 29,90€ →
          </a>
        </nav>

        <button className="md:hidden p-2 -mr-2 rounded-lg" style={{ color: "#50625A" }} onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ background: "#FAF6EF", borderColor: "rgba(16,56,38,0.1)" }}>
          {["Contenu", "Comparaison", "FAQ"].map((label) => (
            <a key={label} href={`#${label.toLowerCase()}`}
              className="block text-sm py-1.5" style={{ color: "#50625A", textDecoration: "none" }}
              onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="#commander" className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium" style={{
            background: "#E4B118", color: "#082E1E", textDecoration: "none",
          }} onClick={() => setOpen(false)}>
            Commander 29,90€ →
          </a>
        </div>
      )}
    </header>
  );
}
