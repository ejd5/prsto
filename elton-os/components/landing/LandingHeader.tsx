"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl transition-all" style={{
      borderColor: "rgba(16,56,38,0.1)",
      background: "rgba(250,246,239,0.92)",
    }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/prsto" className="flex items-center" style={{ textDecoration: "none" }}>
          <Image
            src="/branding/logo-prsto.png"
            alt="PRSTO"
            width={160}
            height={50}
            style={{ objectFit: "contain" }}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {[
            { label: "Fonctionnalités", href: "#fonctionnalites" },
            { label: "Tarifs", href: "#tarifs" },
            { label: "Témoignages", href: "#temoignages" },
            { label: "Ressources", href: "/prsto/ressources" },
            { label: "Blog", href: "/prsto/blog" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a key={link.label} href={link.href} className="text-[13.5px] font-medium transition-colors" style={{
              color: "#50625A", textDecoration: "none",
            }}>
              {link.label}
            </a>
          ))}
          <Link href="/prsto/enterprise" className="text-[13.5px] font-semibold transition-colors flex items-center gap-1" style={{
            color: "#A38010", textDecoration: "none",
          }}>
            Entreprise
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/demarrage" className="px-5 py-2 rounded-xl text-[13.5px] font-semibold transition-all" style={{
            background: "#103826", border: "1px solid #103826",
            color: "#FFFDF8", textDecoration: "none",
          }}>
            Essai gratuit →
          </Link>
        </nav>

        <button className="md:hidden p-2 -mr-2 rounded-lg" style={{ color: "#50625A" }} onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ background: "#FAF6EF", borderColor: "rgba(16,56,38,0.1)" }}>
          {[
            { label: "Fonctionnalités", href: "#fonctionnalites" },
            { label: "Tarifs", href: "#tarifs" },
            { label: "Témoignages", href: "#temoignages" },
            { label: "Ressources", href: "/prsto/ressources" },
            { label: "Blog", href: "/prsto/blog" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a key={link.label} href={link.href}
              className="block text-sm py-1.5" style={{ color: "#50625A", textDecoration: "none" }}
              onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/prsto/enterprise" className="block text-sm py-1.5 font-semibold" style={{
            color: "#A38010", textDecoration: "none",
          }} onClick={() => setOpen(false)}>
            Entreprise →
          </Link>
          <Link href="/demarrage" className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium" style={{
            background: "#103826", border: "1px solid #103826",
            color: "#FFFDF8", textDecoration: "none",
          }} onClick={() => setOpen(false)}>
            Essai gratuit →
          </Link>
        </div>
      )}
    </header>
  );
}
