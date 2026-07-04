"use client";

import { useState, type FormEvent } from "react";

export default function OrderForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    linkedin: "",
    role: "",
    company: "",
    cv: "",
    jd: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/executive-brief/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erreur génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `executive-brief-${form.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ background: "rgba(34,197,94,0.12)" }}>
          ✓
        </div>
        <h2 className="text-2xl font-bold mb-3">Votre Executive Brief est prêt !</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
          Le téléchargement a démarré automatiquement. Vous pouvez aussi le retrouver dans votre espace personnel.
        </p>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10 justify-center">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold transition-all"
              style={{
                background: step >= s ? "rgba(228,177,24,0.2)" : "rgba(255,255,255,0.05)",
                color: step >= s ? "#E4B118" : "rgba(255,255,255,0.25)",
                border: step >= s ? "1px solid rgba(228,177,24,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              {s}
            </div>
            <span className="text-[12px] font-medium" style={{ color: step >= s ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
              {s === 1 ? "Votre profil" : "Le poste"}
            </span>
            {s < 2 && <div className="w-8 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Nom complet <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="ex : Thomas Dubois"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Email <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="ex : thomas@exemple.com"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              LinkedIn (optionnel)
            </span>
            <input
              value={form.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="https://linkedin.com/in/thomasdubois"
            />
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              Pour l&apos;audit LinkedIn inclus dans votre dossier.
            </p>
          </label>

          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Votre CV (collez le texte) <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <textarea
              required
              rows={8}
              value={form.cv}
              onChange={(e) => update("cv", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-y"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="Collez ici le contenu de votre CV (postes, missions, résultats...)"
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Poste visé <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <input
              required
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="ex : Directeur Commercial"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Entreprise ciblée <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <input
              required
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="ex : LVMH"
            />
          </label>

          <label className="block">
            <span className="text-[13px] font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
              Description du poste / annonce <span style={{ color: "#ef4444" }}>*</span>
            </span>
            <textarea
              required
              rows={8}
              value={form.jd}
              onChange={(e) => update("jd", e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-y"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
              placeholder="Collez l'annonce ou la description du poste"
            />
          </label>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
            }}>
            ← Retour
          </button>
        ) : <div />}

        {step < 2 ? (
          <button type="button" onClick={() => setStep(2)}
            className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
            }}>
            Suivant →
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl text-[14px] font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #E4B118, #C49A14)",
              color: "#000",
              boxShadow: "0 4px 20px rgba(228,177,24,0.2)",
            }}>
            {loading ? "Génération en cours..." : "Générer mon Executive Brief →"}
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center mt-8">
          <div className="w-8 h-8 border-2 rounded-full mx-auto mb-3 animate-spin"
            style={{ borderColor: "rgba(228,177,24,0.3)", borderTopColor: "#E4B118" }} />
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Génération de votre dossier personnalisé... Cela prend environ 30 secondes.
          </p>
        </div>
      )}
    </form>
  );
}
