"use client";

import { useState, useEffect, use } from "react";
import { Loader2, ArrowLeft, Mail, Phone, Link2, Building2, MessageSquare, Briefcase, Calendar, Clock, UserPlus, Pencil } from "lucide-react";
import Link from "next/link";

interface ContactDetail {
  id: string; fullName: string; firstName?: string; lastName?: string; email?: string; phone?: string;
  linkedinUrl?: string; roleTitle?: string; companyName?: string; firmName?: string;
  contactType: string; location?: string; notes?: string; tagsJson?: string;
  relationshipStrength?: string; lastContactedAt?: string; nextFollowUpAt?: string;
  interactions: Array<{ id: string; type: string; direction: string; subject?: string; body?: string; outcome?: string; occurredAt: string; nextActionAt?: string;
    applicationDraft?: { id: string } | null; job?: { id: string; title: string; company?: string } | null;
  }>;
  drafts: Array<{ id: string; status: string; pipelineStatus?: string; job?: { title: string; company?: string } }>;
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/crm/contacts/${id}`);
    const d = await r.json();
    setContact(d.contact || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const addNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    await fetch("/api/crm/interactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: id, type: "note", direction: "internal_note", body: noteText, outcome: "neutral" }),
    });
    setNoteText(""); setAddingNote(false); load();
  };

  const genRelance = async () => {
    const r = await fetch("/api/crm/interactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: id, type: "follow_up", direction: "outbound",
        subject: "Relance candidature", outcome: "pending",
        body: `Bonjour ${contact?.firstName || contact?.fullName.split(" ")[0]},\n\nJe fais suite à ma candidature et reste à votre disposition pour un échange.\n\nCordialement,\nELTON DUARTE`,
        nextActionAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (r.ok) { load(); setMsg("Relance enregistrée."); setTimeout(() => setMsg(""), 2000); }
  };

  const typeLabel: Record<string, string> = { recruiter: "Recruteur", headhunter: "Chasseur", hiring_manager: "Hiring Manager", hr: "RH", founder: "Fondateur", executive: "Dirigeant", network: "Réseau", unknown: "Inconnu" };
  const typeColor: Record<string, string> = { recruiter: "#3b82f6", headhunter: "#8b5cf6", hiring_manager: "#22c55e", hr: "#f59e0b", founder: "#ef4444", executive: "#c8a64e", network: "#6366f1", unknown: "#9ca3af" };
  const interactionTypeLabel: Record<string, string> = { email: "Email", linkedin_message: "LinkedIn", phone_call: "Appel", meeting: "RDV", interview: "Entretien", note: "Note", follow_up: "Relance", intro: "Intro", other: "Autre" };

  if (loading) return <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>;
  if (!contact) return <div className="p-8 text-center" style={{ color: "var(--texte-tertiaire)" }}>Contact introuvable.</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link href="/dashboard/jobs/crm" className="flex items-center gap-1 text-xs font-mono mb-4" style={{ color: "var(--texte-tertiaire)", textDecoration: "none" }}>
        <ArrowLeft size={12} /> CRM
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--texte)" }}>{contact.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: `${typeColor[contact.contactType]}15`, color: typeColor[contact.contactType] }}>
              {typeLabel[contact.contactType]}
            </span>
            {contact.companyName && <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}><Building2 size={10} className="inline mr-0.5" />{contact.companyName}</span>}
            {contact.firmName && <span className="text-xs" style={{ color: "var(--or)" }}>🏢 {contact.firmName}</span>}
          </div>
        </div>
        <button onClick={genRelance} className="px-3 py-1.5 rounded text-xs font-mono font-bold text-black" style={{ background: "var(--or)" }}>
          <Clock size={12} className="inline mr-1" /> Relancer
        </button>
      </div>

      {msg && <div className="p-2 mb-3 rounded text-xs font-mono" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{msg}</div>}

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {contact.email && <Info icon={<Mail size={12} />} label="Email" value={contact.email} />}
        {contact.phone && <Info icon={<Phone size={12} />} label="Téléphone" value={contact.phone} />}
        {contact.linkedinUrl && <Info icon={<Link2 size={12} />} label="LinkedIn" value={contact.linkedinUrl} link />}
        {contact.location && <Info icon={<Building2 size={12} />} label="Localisation" value={contact.location} />}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="p-3 mb-4 rounded-lg border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
          <span className="font-bold" style={{ color: "var(--texte-tertiaire)" }}>Notes : </span>
          <span style={{ color: "var(--texte-secondaire)" }}>{contact.notes}</span>
        </div>
      )}

      {/* Candidatures liées */}
      {contact.drafts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold mb-2" style={{ color: "var(--texte)" }}>Candidatures liées ({contact.drafts.length})</h3>
          <div className="space-y-1">
            {contact.drafts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
                <span style={{ color: "var(--texte)" }}>{d.job?.title}</span>
                <Link href={`/dashboard/jobs/applications/${d.id}`}
                  className="font-mono" style={{ color: "var(--or)", textDecoration: "none" }}>Voir</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="mb-6">
        <h3 className="text-xs font-bold mb-2" style={{ color: "var(--texte)" }}>Historique ({contact.interactions.length})</h3>
        {contact.interactions.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Aucune interaction.</p>
        ) : (
          <div className="space-y-1">
            {contact.interactions.slice(0, 15).map(ix => (
              <div key={ix.id} className="p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: ix.direction === "internal_note" ? "rgba(245,158,11,0.03)" : "var(--fond-surface)" }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--fond)", color: "var(--texte-tertiaire)" }}>{interactionTypeLabel[ix.type]}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                    {new Date(ix.occurredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {ix.outcome && ix.outcome !== "pending" && <span className="text-[9px] font-mono" style={{ color: ix.outcome === "positive" ? "#22c55e" : ix.outcome === "negative" ? "#ef4444" : "#f59e0b" }}>{ix.outcome}</span>}
                </div>
                {ix.subject && <div className="mt-1 font-medium" style={{ color: "var(--texte)" }}>{ix.subject}</div>}
                {ix.body && <div className="mt-0.5 whitespace-pre-wrap" style={{ color: "var(--texte-secondaire)", maxHeight: 100, overflow: "hidden" }}>{ix.body.slice(0, 400)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add note */}
      <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="Ajouter une note…"
          className="w-full px-2 py-1.5 rounded border text-xs mb-2" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)", resize: "vertical" }} />
        <button onClick={addNote} disabled={addingNote || !noteText.trim()}
          className="px-3 py-1.5 rounded text-xs font-mono text-black"
          style={{ background: addingNote ? "var(--bordure-douce)" : "var(--or)" }}>
          {addingNote ? "Enregistrement…" : "Ajouter une note"}
        </button>
      </div>
    </div>
  );
}

function Info({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--texte-secondaire)" }}>
      <span style={{ color: "var(--texte-tertiaire)" }}>{icon}</span>
      <span className="font-mono text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>{label}:</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener" className="truncate" style={{ color: "var(--or)" }}>{value.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50)}</a>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}
