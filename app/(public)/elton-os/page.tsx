"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase, FileText, Search, Shield, Sparkles, ArrowRight,
  CheckCircle2, AlertTriangle, BarChart3, Radar, Bell, Send,
  Eye, ExternalLink, Cpu, Users, Globe, Lock, Loader2, Mail,
} from "lucide-react";

const MODULES = [
  { icon: FileText, title: "Profil exécutif", description: "Identité, ciblage, compétences, langues, certifications. Un profil complet pour matcher les bonnes offres." },
  { icon: Shield, title: "CV Maître", description: "Importez votre CV, l&apos;IA le parse et en extrait vos expériences clés automatiquement." },
  { icon: Shield, title: "Proof Vault", description: "Centralisez vos preuves chiffrées : CA, équipes, budgets, certifications. L&apos;IA les utilise pour vos candidatures." },
  { icon: Radar, title: "Sourcing", description: "Import automatique depuis France Travail, LinkedIn, APEC, sites corporate. Priorités géographiques configurables." },
  { icon: Globe, title: "Browser Agent", description: "Connexion sécurisée à LinkedIn, Indeed, APEC. Login manuel, recherche headless, aucun bypass CAPTCHA." },
  { icon: Cpu, title: "Scoring IA", description: "Chaque offre est scorée sur 7 dimensions : matching, localisation, salaire, fraîcheur, entreprise, risque." },
  { icon: Sparkles, title: "Candidature IA", description: "CV adapté, lettre de motivation, email, réponses ATS — générés par IA, vérifiés contre votre CV maître." },
  { icon: Send, title: "Candidature assistée", description: "Champs pré-remplis pour postuler sur les sites d&apos;offres. Copiez, collez, envoyez. L&apos;outil ne postule jamais." },
  { icon: Briefcase, title: "Pipeline", description: "Kanban 8 colonnes : envoyées, à relancer, relancées, réponse reçue, entretien, offre, refusées, archivées." },
  { icon: Bell, title: "Relances intelligentes", description: "4 formats de relance générés par IA : email court, LinkedIn, formelle, ultra courte. Texte copiable uniquement." },
  { icon: BarChart3, title: "Analytics", description: "Taux de réponse, taux d&apos;entretien, taux d&apos;offre. Segmentation par source, score, zone géographique." },
  { icon: Eye, title: "Mode démo", description: "Dataset fictif complet pour découvrir l&apos;outil sans données personnelles. Aucune action réelle déclenchée." },
];

const FAQ_ITEMS = [
  { q: "Est-ce que l&apos;outil postule automatiquement ?", r: "Non. ELTON OS ne postule jamais à votre place. Il prépare les contenus, vous restez maître de l&apos;envoi. C&apos;est un copilote, pas un pilote automatique." },
  { q: "Est-ce que l&apos;outil envoie des emails automatiquement ?", r: "Non. Aucun email, message LinkedIn ou relance n&apos;est envoyé automatiquement. Tout est généré pour être copié et envoyé manuellement par vous." },
  { q: "Est-ce compatible avec LinkedIn ?", r: "Oui, via le Browser Agent qui ouvre une session visible. Vous vous connectez manuellement, l&apos;outil navigue pour vous. Aucun bypass de sécurité." },
  { q: "Est-ce que mes données sont envoyées à l&apos;IA ?", r: "Vous choisissez. Trois modes : local (rien ne sort), anonymisé (données masquées avant envoi), complet. La clé API DeepSeek est sous votre contrôle." },
  { q: "Est-ce que mon CV maître est modifié ?", r: "Jamais. Le CV maître est votre référence. L&apos;IA crée des versions adaptées pour chaque offre, sans altérer l&apos;original." },
  { q: "Est-ce que je peux tester sans données personnelles ?", r: "Oui. Le mode démo (?demo=true) crée un dataset fictif complet : 10 offres, 6 candidatures, pipeline rempli. Aucune donnée réelle utilisée." },
  { q: "Est-ce que l&apos;outil remplace un coach carrière ?", r: "Non. ELTON OS est un assistant technique. Un coach apporte un regard humain, une stratégie et un accompagnement que la technologie ne remplace pas." },
  { q: "Est-ce que l&apos;outil garantit un emploi ou un entretien ?", r: "Non. Aucun outil ne peut garantir un emploi. ELTON OS vous aide à être plus efficace, plus organisé et plus pertinent dans vos candidatures." },
];

const COMPARISON = [
  { label: "Sourcing automatisé", tracker: "Parfois", generator: "Non", autoapply: "Oui (risqué)", elton: "✅ Multi-source" },
  { label: "Scoring intelligent", tracker: "Non", generator: "Non", autoapply: "Basique", elton: "✅ 7 dimensions" },
  { label: "CV adapté IA", tracker: "Non", generator: "✅ Générique", autoapply: "Parfois", elton: "✅ Personnalisé" },
  { label: "Lettre + email IA", tracker: "Non", generator: "✅", autoapply: "Non", elton: "✅ 4 formats" },
  { label: "Réponses ATS", tracker: "Non", generator: "Non", autoapply: "Non", elton: "✅ Générées" },
  { label: "Candidature assistée", tracker: "Non", generator: "Non", autoapply: "✅ Autofill", elton: "✅ Copie manuelle" },
  { label: "Pipeline Kanban", tracker: "✅", generator: "Non", autoapply: "Parfois", elton: "✅ 8 colonnes" },
  { label: "Relances IA", tracker: "Non", generator: "Non", autoapply: "Non", elton: "✅ 4 formats" },
  { label: "Analytics", tracker: "Parfois", generator: "Non", autoapply: "Non", elton: "✅ Complet" },
  { label: "Contrôle humain", tracker: "✅", generator: "✅", autoapply: "❌ Faible", elton: "✅ Obligatoire" },
  { label: "Risque spam / blacklist", tracker: "Aucun", generator: "Aucun", autoapply: "❌ Élevé", elton: "✅ Aucun" },
];

export default function PublicEltonOSPage() {
  const [form, setForm] = useState({ name: "", email: "", profile: "cadre", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { setError("L&apos;email est requis."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/elton-os/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--fond)" }}>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--bordure)", background: "linear-gradient(135deg, var(--fond-surface) 0%, var(--fond) 100%)" }}>
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono mb-6" style={{ borderColor: "var(--or)", color: "var(--or)", background: "rgba(255,180,50,0.05)" }}>
            <Sparkles size={12} /> Agent exécutif de recherche d&apos;emploi
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: "var(--texte)" }}>
            Trouvez, préparez, suivez.<br />
            <span style={{ color: "var(--or)" }}>Sans jamais déléguer l&apos;envoi.</span>
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS est un copilote IA pour cadres dirigeants. Il automatise la recherche, la préparation, le suivi et l&apos;optimisation de vos candidatures — sans jamais postuler, envoyer un email ou spammer à votre place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/demarrage" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors" style={{ background: "var(--or)", color: "#000", textDecoration: "none" }}>
              <Sparkles size={16} /> Démarrer le profil guidé
            </Link>
            <a href="/dashboard/jobs?demo=true" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-colors" style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
              <Eye size={16} /> Voir la démo
            </a>
          </div>
          <p className="text-xs mt-4" style={{ color: "var(--texte-tertiaire)" }}>Données fictives. Aucune action réelle n&apos;est déclenchée.</p>
        </div>
      </section>

      {/* ─── Problème / Solution ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#ef4444" }}>Le problème</h2>
            <p className="text-lg font-medium mb-3" style={{ color: "var(--texte)" }}>La recherche d&apos;emploi cadre est chronophage, désorganisée et solitaire.</p>
            <ul className="space-y-2 text-sm" style={{ color: "var(--texte-secondaire)" }}>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} /> Des dizaines d&apos;offres à trier manuellement</li>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} /> Des CV et lettres à réécrire pour chaque poste</li>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} /> Des relances oubliées, des délais qui s&apos;allongent</li>
              <li className="flex items-start gap-2"><AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} /> Aucune visibilité sur ce qui fonctionne ou non</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#22c55e" }}>La solution</h2>
            <p className="text-lg font-medium mb-3" style={{ color: "var(--texte)" }}>Un agent IA qui structure, automatise et optimise — sous votre contrôle.</p>
            <ul className="space-y-2 text-sm" style={{ color: "var(--texte-secondaire)" }}>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> Import automatique depuis 5+ sources d&apos;offres</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> CV, lettres, emails générés et personnalisés en un clic</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> Pipeline Kanban + relances intelligentes</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} /> Analytics : taux de réponse, entretiens, offres</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section className="border-y py-16 md:py-20" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-3" style={{ color: "var(--texte)" }}>Comment ça marche</h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-secondaire)" }}>Quatre étapes, zéro envoi automatique.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Configurez", desc: "Importez votre CV, définissez vos cibles : rôles, pays, secteurs, salaire.", icon: FileText },
              { step: 2, title: "Sourcez", desc: "L&apos;agent importe les offres depuis France Travail, LinkedIn, APEC et plus.", icon: Search },
              { step: 3, title: "Préparez", desc: "L&apos;IA génère CV, lettre, email. Vous révisez, vous validez, vous postulez.", icon: Sparkles },
              { step: 4, title: "Suivez", desc: "Pipeline, relances, analytics. Vous savez où vous en êtes, en temps réel.", icon: BarChart3 },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-3 p-4 rounded-xl border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--or-faible)" }}>
                  <s.icon size={18} style={{ color: "var(--or)" }} />
                </div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "var(--or)" }}>Étape {s.step}</div>
                <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>{s.title}</h3>
                <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Modules ─── */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: "var(--texte)" }}>Modules</h2>
        <p className="text-sm text-center mb-10" style={{ color: "var(--texte-secondaire)" }}>Douze modules intégrés pour couvrir tout le cycle de candidature.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <div key={m.title} className="p-4 rounded-xl border space-y-2" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <div className="flex items-center gap-2">
                <m.icon size={16} style={{ color: "var(--or)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>{m.title}</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Sécurité / Contrôle ─── */}
      <section className="border-y py-12" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Lock size={28} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--texte)" }}>Vous gardez le contrôle</h2>
          <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS ne postule jamais, n&apos;envoie jamais d&apos;email, ne spamme jamais.
            L&apos;IA est un copilote. L&apos;humain valide, copie, envoie.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            {[
              { icon: AlertTriangle, label: "Aucun envoi automatique", color: "#f59e0b" },
              { icon: Shield, label: "Données en local (SQLite)", color: "#22c55e" },
              { icon: Users, label: "Validation humaine obligatoire", color: "#6366f1" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <s.icon size={16} className="mx-auto mb-1.5" style={{ color: s.color }} />
                <p style={{ color: "var(--texte)" }} className="font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Démo ─── */}
      <section className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-center">
        <Eye size={32} className="mx-auto mb-4" style={{ color: "#8b5cf6" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--texte)" }}>Essayez la démo</h2>
        <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>
          Découvrez ELTON OS avec un dataset fictif complet. 10 offres, pipeline rempli, analytics.
          Aucune donnée personnelle requise. Aucune action réelle déclenchée.
        </p>
        <a href="/dashboard/jobs?demo=true" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors" style={{ background: "#8b5cf6", color: "#fff", textDecoration: "none" }}>
          <ExternalLink size={16} /> Ouvrir la démo
        </a>
        <p className="text-xs mt-3" style={{ color: "var(--texte-tertiaire)" }}>Données fictives. Aucune action réelle n&apos;est déclenchée.</p>
      </section>

      {/* ─── Accès fondateur ─── */}
      <section className="border-y py-16 md:py-20" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="max-w-xl mx-auto px-6">
          <Mail size={28} className="mx-auto mb-4" style={{ color: "var(--or)" }} />
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--texte)" }}>Accès fondateur</h2>
          <p className="text-sm text-center mb-8" style={{ color: "var(--texte-secondaire)" }}>
            Intéressé par ELTON OS ? Laissez vos coordonnées pour être informé des prochaines étapes.
            Aucun spam, aucune revente de données.
          </p>

          {submitted ? (
            <div className="p-6 rounded-xl border text-center" style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.05)" }}>
              <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Merci pour votre intérêt !</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>Nous vous recontacterons prochainement.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--texte-tertiaire)" }}>Nom</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Votre nom"
                  className="w-full p-2.5 rounded-lg border text-sm" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
              </div>
              <div>
                <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--texte-tertiaire)" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com"
                  className="w-full p-2.5 rounded-lg border text-sm" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
              </div>
              <div>
                <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--texte-tertiaire)" }}>Profil</label>
                <select value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })}
                  className="w-full p-2.5 rounded-lg border text-sm" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                  <option value="cadre">Cadre dirigeant</option>
                  <option value="recruteur">Recruteur / Cabinet</option>
                  <option value="coach">Coach carrière</option>
                  <option value="investisseur">Investisseur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--texte-tertiaire)" }}>Message (optionnel)</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} maxLength={500} placeholder="Votre message..."
                  className="w-full p-2.5 rounded-lg border text-sm resize-none" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
              </div>
              {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                En envoyant ce formulaire, vous acceptez d&apos;être recontacté au sujet d&apos;ELTON OS. Vos données ne sont ni revendues ni partagées.
              </p>
              <button type="submit" disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--or)", color: "#000", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Envoyer
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── Comparatif ─── */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-3" style={{ color: "var(--texte)" }}>Comparaison</h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-secondaire)" }}>ELTON OS vs les catégories d&apos;outils existantes. Comparaison indicative.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bordure)" }}>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Fonctionnalité</th>
                  <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Trackers</th>
                  <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Générateurs CV</th>
                  <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Auto-apply</th>
                  <th className="text-center p-2.5" style={{ color: "var(--or)", fontWeight: "bold" }}>ELTON OS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} style={{ borderBottom: "1px solid var(--bordure-douce)" }}>
                    <td className="p-2.5" style={{ color: "var(--texte)" }}>{row.label}</td>
                    <td className="p-2.5 text-center" style={{ color: "var(--texte-tertiaire)" }}>{row.tracker}</td>
                    <td className="p-2.5 text-center" style={{ color: "var(--texte-tertiaire)" }}>{row.generator}</td>
                    <td className="p-2.5 text-center" style={{ color: "#ef4444" }}>{row.autoapply}</td>
                    <td className="p-2.5 text-center font-medium" style={{ color: "var(--or)" }}>{row.elton}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "var(--texte)" }}>Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="p-4 rounded-lg border cursor-pointer" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <summary className="text-sm font-medium" style={{ color: "var(--texte)" }}>{item.q}</summary>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>{item.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="border-t py-16 md:py-20 text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="max-w-2xl mx-auto px-6">
          <Sparkles size={32} className="mx-auto mb-4" style={{ color: "var(--or)" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--texte)" }}>Prêt à structurer votre recherche ?</h2>
          <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>Importez votre CV, configurez vos cibles, et laissez l&apos;IA vous assister — sans jamais perdre le contrôle.</p>
          <Link href="/demarrage" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors" style={{ background: "var(--or)", color: "#000", textDecoration: "none" }}>
            <Sparkles size={16} /> Démarrer le profil guidé
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderColor: "var(--bordure-douce)" }}>
        <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
          ELTON OS — Agent exécutif de recherche d&apos;emploi. Projet open source.
        </p>
        <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
          Aucun envoi automatique. Aucun contournement de sécurité. Aucune garantie d&apos;emploi.
        </p>
      </footer>
    </div>
  );
}
