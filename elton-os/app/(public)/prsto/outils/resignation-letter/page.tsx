"use client";

import { useState } from "react";
import { Loader2, Ban, Copy, Check, FileText, ShieldCheck } from "lucide-react";

interface ResignationResult {
  letters: Array<{ type: string; text: string }>;
  legalReminders?: string[];
  provider?: string;
}

export default function ResignationLetterPage() {
  const [form, setForm] = useState({
    employeeName: "",
    currentRole: "",
    company: "",
    lastDay: "",
    reason: "career" as "career" | "personal" | "conflict" | "opportunity",
    noticeWeeks: 12,
    gardenLeave: false,
    nonCompete: false,
    isBoardMember: false,
    handoverNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResignationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const generate = async () => {
    if (!form.employeeName || !form.currentRole || !form.company || !form.lastDay) {
      setError("Tous les champs obligatoires (*) doivent être remplis");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tools/resignation-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const copy = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const inputStyle = {
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    color: "var(--texte)",
  } as const;

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
            <Ban size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">Executive · Garden leave</span>
          </div>
          <h1 className="font-serif text-4xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Resignation Letter Executive
          </h1>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            Démission de cadre dirigeant avec clauses garden leave, non-compète, mandat social au Board, plan de passation.
          </p>
          <p className="text-xs mt-3" style={{ color: "var(--texte-tertiaire)" }}>
            Rezi propose une lettre générique. PRSTO gère les specifics exécutives (Board, garden leave, non-compète).
          </p>
        </div>

        {!result ? (
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Votre nom *"
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Votre poste *"
                value={form.currentRole}
                onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Entreprise *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="date"
                placeholder="Date de fin souhaitée *"
                value={form.lastDay}
                onChange={(e) => setForm({ ...form, lastDay: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <select
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value as "career" | "personal" | "conflict" | "opportunity" })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                <option value="career">Opportunité career</option>
                <option value="personal">Raison personnelle</option>
                <option value="conflict">Conflit / désaccord</option>
                <option value="opportunity">Opportunité entrepreneuriale</option>
              </select>
              <input
                type="number"
                placeholder="Préavis (semaines)"
                value={form.noticeWeeks}
                onChange={(e) => setForm({ ...form, noticeWeeks: parseInt(e.target.value) || 12 })}
                className="p-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>

            {/* Executive options */}
            <div className="mb-4 p-4 rounded-lg" style={{ background: "#F9FAFB" }}>
              <div className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: "var(--texte-secondaire)" }}>
                Options executive
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gardenLeave}
                    onChange={(e) => setForm({ ...form, gardenLeave: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: "var(--texte)" }}>Garden leave</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.nonCompete}
                    onChange={(e) => setForm({ ...form, nonCompete: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: "var(--texte)" }}>Clause non-compète</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isBoardMember}
                    onChange={(e) => setForm({ ...form, isBoardMember: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: "var(--texte)" }}>Membre du Board</span>
                </label>
              </div>
            </div>

            <textarea
              placeholder="Notes de passation (optionnel) — projet en cours, dossiers à transférer, contacts clés"
              value={form.handoverNotes}
              onChange={(e) => setForm({ ...form, handoverNotes: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-lg text-sm outline-none mb-4 resize-y"
              style={inputStyle}
            />
            {error && (
              <div className="text-sm p-3 rounded mb-3" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </div>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--prsto-forest)", color: "#FFF" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              Générer mes lettres
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {result.letters.map((letter, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} style={{ color: i === 0 ? "#3B82F6" : "#F59E0B" }} />
                    <span className="text-sm font-semibold uppercase" style={{ color: "var(--texte)" }}>
                      Version {letter.type === "standard" ? "standard" : "executive (clauses incluses)"}
                    </span>
                  </div>
                  <button
                    onClick={() => copy(letter.type, letter.text)}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{ background: "#F9FAFB", color: "var(--texte)" }}
                  >
                    {copiedType === letter.type ? <Check size={12} style={{ color: "#10B981" }} /> : <Copy size={12} />}
                    {copiedType === letter.type ? "Copié" : "Copier"}
                  </button>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans p-4 rounded-lg" style={{ background: "#F9FAFB", color: "var(--texte)" }}>
                  {letter.text}
                </pre>
              </div>
            ))}

            {/* Legal reminders */}
            {result.legalReminders && result.legalReminders.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} style={{ color: "#3B82F6" }} />
                  <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#1E40AF" }}>
                    Rappels juridiques
                  </span>
                </div>
                <ul className="space-y-2">
                  {result.legalReminders.map((r, i) => (
                    <li key={i} className="text-xs flex gap-2" style={{ color: "var(--texte-secondaire)" }}>
                      <span style={{ color: "#3B82F6" }}>→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] mt-3 italic" style={{ color: "var(--texte-tertiaire)" }}>
                  ⚠️ Ces rappels sont indicatifs et ne constituent pas un conseil juridique. Consultez un avocat pour toute démission de cadre dirigeant.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setResult(null)}
                className="text-sm px-6 py-2 rounded-lg"
                style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              >
                Générer d'autres lettres
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
