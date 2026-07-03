"use client";

import { useState, useEffect } from "react";
import { Loader2, UserPlus, Search, Building2, Calendar, MessageSquare, Briefcase, Phone, Mail, Link2, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ContactRow {
  id: string; fullName: string; contactType: string; companyName?: string; firmName?: string;
  roleTitle?: string; lastContactedAt?: string; nextFollowUpAt?: string; relationshipStrength?: string;
  _count: { interactions: number; drafts: number };
}

export default function CrmPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"contacts" | "add">("contacts");
  const [form, setForm] = useState({ fullName: "", contactType: "recruiter", companyName: "", firmName: "", email: "", phone: "", linkedinUrl: "", roleTitle: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Spott Enrichment states
  const [enrichUrl, setEnrichUrl] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/crm/contacts${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    const d = await r.json();
    setContacts(d.contacts || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleSave = async () => {
    if (!form.fullName) return;
    setSaving(true);
    await fetch("/api/crm/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ fullName: "", contactType: "recruiter", companyName: "", firmName: "", email: "", phone: "", linkedinUrl: "", roleTitle: "", notes: "" });
    setSaving(false);
    setTab("contacts");
    load();
  };

  const handleEnrich = async () => {
    if (!enrichUrl.trim()) return;
    setEnriching(true);
    setEnrichError("");
    try {
      const res = await fetch("/api/crm/enrich-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: enrichUrl })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'enrichissement par Spott AI");
      }
      const c = data.contact;
      setForm({
        fullName: c.fullName || "",
        contactType: c.contactType || "recruiter",
        companyName: c.companyName || "",
        firmName: c.firmName || "",
        email: c.email || "",
        phone: c.phone || "",
        linkedinUrl: c.linkedinUrl || "",
        roleTitle: c.roleTitle || "",
        notes: c.notes || ""
      });
      setEnrichUrl("");
    } catch (err: any) {
      setEnrichError(err.message || "Erreur d'enrichissement");
    } finally {
      setEnriching(false);
    }
  };

  const typeLabel: Record<string, string> = { recruiter: "Recruteur", headhunter: "Chasseur", hiring_manager: "Hiring Manager", hr: "RH", founder: "Fondateur", executive: "Dirigeant", network: "Réseau", unknown: "Inconnu" };
  const typeColor: Record<string, string> = { recruiter: "#3b82f6", headhunter: "#8b5cf6", hiring_manager: "#22c55e", hr: "#f59e0b", founder: "#ef4444", executive: "#c8a64e", network: "#6366f1", unknown: "#9ca3af" };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold" style={{ color: "var(--texte)" }}>
          <UserPlus size={20} className="inline mr-2" style={{ color: "var(--or)" }} />
          CRM Clients
        </h1>
        <button onClick={() => { setTab(tab === "add" ? "contacts" : "add"); setEnrichError(""); }}
          className="px-3 py-1.5 rounded text-xs font-mono font-bold"
          style={{ background: tab === "add" ? "var(--texte-tertiaire)" : "var(--or)", color: "#000" }}>
          {tab === "add" ? "← Annuler" : "+ Ajouter un contact"}
        </button>
      </div>

      {/* Search */}
      {tab === "contacts" && (
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un contact, une société, un cabinet…"
            className="flex-1 px-3 py-2 rounded border text-xs font-mono"
            style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
          <button type="submit" className="px-4 py-2 rounded text-xs font-mono font-bold text-black" style={{ background: "var(--or)" }}>
            <Search size={12} className="inline mr-1" /> Rechercher
          </button>
        </form>
      )}

      {/* Add form */}
      {tab === "add" && (
        <div className="p-4 rounded-lg border mb-4 space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          {/* Spott Sourcing Input */}
          <div className="p-3 mb-4 rounded-md border" style={{ borderColor: "var(--or)", background: "rgba(200, 166, 78, 0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--or)" }}>Import intelligent Spott AI</h4>
              <span className="text-[9px] px-1 rounded bg-[#c8a64e]/10 text-amber-500 font-mono">Premium</span>
            </div>
            <div className="flex gap-2">
              <input type="url" value={enrichUrl} onChange={e => setEnrichUrl(e.target.value)}
                placeholder="Coller l'URL du profil LinkedIn (ex: https://linkedin.com/in/sandra)..."
                className="flex-1 px-2.5 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
              <button onClick={handleEnrich} disabled={enriching || !enrichUrl}
                className="px-3 py-1.5 rounded text-xs font-mono font-bold text-black flex items-center gap-1.5"
                style={{ background: enriching ? "var(--bordure-douce)" : "var(--or)" }}>
                {enriching ? <Loader2 size={12} className="animate-spin" /> : "Enrichir"}
              </button>
            </div>
            {enrichError && <p className="text-[10px] mt-1 text-red-500 font-mono">{enrichError}</p>}
          </div>

          <h3 className="text-xs font-bold" style={{ color: "var(--or)" }}>Nouveau contact</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Nom complet *</label>
              <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Type</label>
              <select value={form.contactType} onChange={e => setForm({ ...form, contactType: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }}>
                {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Société</label>
              <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Cabinet</label>
              <input type="text" value={form.firmName} onChange={e => setForm({ ...form, firmName: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>LinkedIn</label>
              <input type="url" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Rôle</label>
              <input type="text" value={form.roleTitle} onChange={e => setForm({ ...form, roleTitle: e.target.value })}
                className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)", resize: "vertical" }} />
          </div>
          <button onClick={handleSave} disabled={saving || !form.fullName}
            className="px-4 py-2 rounded text-xs font-mono font-bold text-black"
            style={{ background: saving ? "var(--bordure-douce)" : "var(--or)" }}>
            {saving ? "Enregistrement…" : "Créer le contact"}
          </button>
        </div>
      )}

      {/* Contacts list */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-dashed" style={{ borderColor: "var(--bordure-douce)" }}>
          <UserPlus size={28} style={{ color: "var(--texte-tertiaire)", margin: "0 auto" }} />
          <p className="text-sm mt-3" style={{ color: "var(--texte-secondaire)" }}>Aucun client CRM.</p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Ajoutez des recruteurs, cabinets et clients réseau.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--bordure-douce)" }}>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--fond)" }}>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Contact</th>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Type</th>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Société / Cabinet</th>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Dernière interaction</th>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Relance</th>
                <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Candidatures</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--bordure-douce)" }}>
                  <td className="py-2 px-2">
                    <Link href={`/dashboard/jobs/crm/contacts/${c.id}`}
                      className="font-medium hover:underline" style={{ color: "var(--texte)", textDecoration: "none" }}>
                      {c.fullName}
                    </Link>
                    {c.roleTitle && <div className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>{c.roleTitle}</div>}
                  </td>
                  <td className="py-2 px-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: `${typeColor[c.contactType]}15`, color: typeColor[c.contactType] }}>
                      {typeLabel[c.contactType]}
                    </span>
                  </td>
                  <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>
                    {c.companyName || c.firmName || "—"}
                    {c.firmName && <span className="text-[10px] block" style={{ color: "var(--or)" }}>Cabinet</span>}
                  </td>
                  <td className="py-2 px-2" style={{ color: "var(--texte-tertiaire)" }}>
                    {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="py-2 px-2">
                    {c.nextFollowUpAt ? (
                      <span className="text-[10px] font-mono" style={{ color: new Date(c.nextFollowUpAt) <= new Date() ? "#ef4444" : "#22c55e" }}>
                        {new Date(c.nextFollowUpAt).toLocaleDateString("fr-FR")}
                      </span>
                    ) : <span style={{ color: "var(--texte-tertiaire)" }}>—</span>}
                  </td>
                  <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{c._count.drafts || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
