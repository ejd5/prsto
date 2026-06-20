"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket, ArrowRight, User, Shield, Search, Brain,
  FileText, Columns, Calendar, Settings, AlertTriangle,
  CheckCircle2, Star, Clock, Globe,
  TrendingUp, Send, Copy, GitCompare, Download, FlaskConical,
  Target, ClipboardCheck, Sparkles, Play,
} from "lucide-react";

const SECTIONS = [
  { id: "demarrage", label: "1. Démarrage rapide", icon: Rocket },
  { id: "workflow", label: "2. Workflow quotidien", icon: Clock },
  { id: "profil", label: "3. Profil Exécutif", icon: User },
  { id: "proof-vault", label: "4. Proof Vault", icon: Shield },
  { id: "opportunites", label: "5. Opportunités & Market Radar", icon: Search },
  { id: "analyse", label: "6. Analyse & Scoring", icon: Brain },
  { id: "documents", label: "7. Documents", icon: FileText },
  { id: "pipeline", label: "8. Pipeline & Relances", icon: Columns },
  { id: "interview", label: "9. Interview War Room", icon: Calendar },
  { id: "parametres", label: "10. Paramètres IA & Confidentialité", icon: Settings },
  { id: "templates", label: "11. Templates CV", icon: FileText },
  { id: "benchmark", label: "12. Benchmark", icon: TrendingUp },
  { id: "doublons", label: "13. Détection de doublons", icon: GitCompare },
  { id: "sauvegarde", label: "14. Sauvegarde locale", icon: Download },
  { id: "tests", label: "15. Tests automatisés", icon: FlaskConical },
  { id: "usage-reel", label: "16. Passage en usage réel", icon: Target },
  { id: "qualite", label: "17. Assistant qualité", icon: ClipboardCheck },
  { id: "exports", label: "18. Exports professionnels", icon: Download },
  { id: "pilotage", label: "19. Piloter sa recherche", icon: TrendingUp },
  { id: "ia-premium", label: "20. IA Premium DeepSeek", icon: Sparkles },
  { id: "demarrage-guide", label: "21. Démarrage guidé", icon: Target },
  { id: "premiere-session", label: "22. Première session réelle", icon: Play },
];

export default function GuidePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("demarrage");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (path: string) => router.push(path);

  const btn = (label: string, path: string) => (
    <button onClick={() => goTo(path)}
      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors mt-2"
      style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {label} <ArrowRight size={12} />
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Sommaire gauche */}
      <aside className="w-64 flex-shrink-0 overflow-y-auto border-r p-4 space-y-0.5" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h2 className="text-xs font-mono uppercase tracking-wider mb-3 px-2" style={{ color: "var(--texte-tertiaire)" }}>Sommaire</h2>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => scrollTo(id)}
            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors font-mono"
            style={{
              color: activeSection === id ? "var(--or)" : "var(--texte-secondaire)",
              background: activeSection === id ? "var(--or-faible)" : "transparent",
            }}>
            <Icon size={12} />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6 space-y-12" style={{ background: "var(--fond)" }}>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Guide complet ELTON OS</h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Tout ce qu&apos;il faut savoir pour accélérer votre recherche executive — sans IA, sans cloud, sans hallucinations.
          </p>
        </div>

        {/* 1. Démarrage rapide */}
        <Section id="demarrage" icon={Rocket} title="1. Démarrage rapide">
          <StepList steps={[
            { num: "1", title: "Remplir le Profil Exécutif", desc: "Nom, titre, résumé, expertises, mobilité, langues. C'est la source unique de vérité.", path: "/profil" },
            { num: "2", title: "Importer le CV Maître", desc: "Texte brut intégral. Il sert de base à toutes les adaptations.", path: "/cv-maitre" },
            { num: "3", title: "Remplir le Proof Vault", desc: "Ajouter au moins 5 preuves vérifiables (CA, équipe, P&L, croissance, certifications).", path: "/proof-vault" },
            { num: "4", title: "Ajouter une opportunité", desc: "Manuellement ou via copier-coller du texte de l'offre.", path: "/opportunites" },
            { num: "5", title: "Analyser l'offre", desc: "Lancer l'analyse heuristique. Voir le score, les gaps, les risques.", path: "/analyse" },
            { num: "6", title: "Générer les documents", desc: "CV adapté, lettre, email, message LinkedIn. Tout est basé sur vos données réelles.", path: "/documents" },
            { num: "7", title: "Valider", desc: "Relire, corriger si nécessaire, puis approuver le document.", path: "/documents" },
            { num: "8", title: "Ajouter au pipeline", desc: "L'opportunité entre dans le Kanban. Changer les statuts au fil de l'eau.", path: "/pipeline" },
            { num: "9", title: "Relancer", desc: "Générer une relance J+5 ou J+10. Copier, coller, envoyer manuellement.", path: "/pipeline" },
            { num: "10", title: "Préparer l'entretien", desc: "Générer les 24 sections de préparation : pitchs, STAR, objections, négociation.", path: "/entretiens" },
          ]} />
        </Section>

        {/* 2. Workflow quotidien */}
        <Section id="workflow" icon={Clock} title="2. Workflow quotidien">
          <Card color="var(--or)">
            <h4 style={{ color: "var(--texte)" }}>Matin — Recherche & Analyse</h4>
            <ul className="space-y-1 mt-1" style={{ color: "var(--texte-secondaire)" }}>
              <li>• Parcourir les nouvelles offres sur vos sources prioritaires</li>
              <li>• Copier-coller les offres pertinentes dans ELTON OS</li>
              <li>• Lancer l&apos;analyse heuristique (score, gaps, risques)</li>
              <li>• Classer : score ≥ 70 → pipeline, score 50-69 → à surveiller, score &lt; 50 → archive</li>
            </ul>
          </Card>
          <Card color="var(--info)">
            <h4 style={{ color: "var(--texte)" }}>Après-midi — Candidatures & Réseau</h4>
            <ul className="space-y-1 mt-1" style={{ color: "var(--texte-secondaire)" }}>
              <li>• Générer et valider les documents pour les offres prioritaires</li>
              <li>• Envoyer les candidatures manuellement (email, LinkedIn, formulaire ATS)</li>
              <li>• Marquer comme &quot;Envoyé&quot; dans le pipeline</li>
              <li>• Vérifier les relances à faire (J+5, J+10)</li>
              <li>• Générer et envoyer les relances</li>
            </ul>
          </Card>
          <Card color="var(--succes)">
            <h4 style={{ color: "var(--texte)" }}>Fin de semaine — Mesure & Ajustement</h4>
            <ul className="space-y-1 mt-1" style={{ color: "var(--texte-secondaire)" }}>
              <li>• Dashboard : combien d&apos;offres analysées ? Combien en pipeline ?</li>
              <li>• Taux de conversion : offres → analyses → candidatures → entretiens</li>
              <li>• Ajuster les critères de recherche si nécessaire</li>
              <li>• Mettre à jour le Proof Vault avec de nouveaux résultats</li>
            </ul>
          </Card>
        </Section>

        {/* 3. Profil Exécutif */}
        <Section id="profil" icon={User} title="3. Profil Exécutif">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            Le Profil Exécutif est la <strong style={{ color: "var(--texte)" }}>source unique de vérité</strong>.
            Toutes les générations de documents s&apos;appuient exclusivement sur ces données.
            Aucune information n&apos;est inventée.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <FieldGuide field="Titre actuel" example="Directeur Commercial France" tips="Soyez précis. Évitez les titres vagues comme « Manager »." />
            <FieldGuide field="Résumé" example="15 ans d'expérience en direction commerciale B2B..." tips="3-4 phrases. Mentionnez les industries, la taille d'équipe, le CA géré." />
            <FieldGuide field="Mobilité" example="France, Benelux, Europe" tips="Listez les pays où vous pouvez/acceptez de travailler." />
            <FieldGuide field="Langues" example="Français (natif), Anglais (courant), Allemand (B1)" tips="Soyez honnête sur le niveau réel." />
            <FieldGuide field="Salaire cible" example="130k€ fixe + 30% variable" tips="Indiquez une fourchette si flexible." />
            <FieldGuide field="Rôles prioritaires" example="Directeur Commercial, Country Manager" tips="Les rôles que vous ciblez en priorité." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Card color="var(--or)">
              <h4 style={{ color: "var(--texte)" }}>Exemple — Directeur Commercial</h4>
              <ul className="space-y-1 mt-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                <li>• Titre : Directeur Commercial France</li>
                <li>• Résumé : 12 ans en direction commerciale, gestion d&apos;équipes de 20 à 80 personnes</li>
                <li>• Expertises : Négociation grands comptes, stratégie go-to-market, transformation commerciale</li>
                <li>• Secteurs : Industrie, SaaS B2B, Santé</li>
                <li>• CA géré : 15M€ à 80M€</li>
              </ul>
            </Card>
            <Card color="var(--info)">
              <h4 style={{ color: "var(--texte)" }}>Exemple — Country Manager</h4>
              <ul className="space-y-1 mt-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                <li>• Titre : Country Manager France & Benelux</li>
                <li>• Résumé : 18 ans d&apos;expérience, lancement de filiales, P&L ownership</li>
                <li>• Expertises : Création de filiale, gestion P&L, recrutement, stratégie pays</li>
                <li>• Secteurs : Services IT, Conseil, Fintech</li>
                <li>• P&L : 5M€ à 40M€</li>
              </ul>
            </Card>
          </div>
          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--avertissement)" }}>Erreurs à éviter</h4>
          <ul className="space-y-1 mt-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <li className="flex items-start gap-2"><AlertTriangle size={12} style={{ color: "var(--avertissement)", marginTop: 2 }} /> Titre trop vague (ex: &quot;Manager&quot; sans précision)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={12} style={{ color: "var(--avertissement)", marginTop: 2 }} /> Résumé copié-collé depuis LinkedIn sans adaptation</li>
            <li className="flex items-start gap-2"><AlertTriangle size={12} style={{ color: "var(--avertissement)", marginTop: 2 }} /> Chiffres non vérifiables (inventer un CA ou une taille d&apos;équipe)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={12} style={{ color: "var(--avertissement)", marginTop: 2 }} /> Liste de compétences sans preuves associées</li>
          </ul>
          {btn("Aller au Profil", "/profil")}
        </Section>

        {/* 4. Proof Vault */}
        <Section id="proof-vault" icon={Shield} title="4. Proof Vault">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            Le Proof Vault est le <strong style={{ color: "var(--texte)" }}>coffre-fort de vos preuves vérifiables</strong>.
            Chaque affirmation dans vos documents doit être traçable jusqu&apos;à une preuve.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Types de preuves</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Card color="var(--succes)">
              <h4 style={{ color: "var(--succes)" }}>Preuve forte ✓</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Chiffre précis, source vérifiable, période définie.<br />
                <em>Ex : &quot;CA France 2024 : 32M€ (rapport annuel)&quot;</em>
              </p>
            </Card>
            <Card color="var(--or)">
              <h4 style={{ color: "var(--or)" }}>Preuve moyenne ~</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Ordre de grandeur, estimation documentée.<br />
                <em>Ex : &quot;CA France estimé 25-35M€ sur 2023-2024&quot;</em>
              </p>
            </Card>
            <Card color="var(--texte-tertiaire)">
              <h4 style={{ color: "var(--texte-tertiaire)" }}>Preuve faible ✗</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Déclaration sans source, ordre de grandeur approximatif.<br />
                <em>À utiliser uniquement en dernier recours.</em>
              </p>
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Exemples de preuves à documenter</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <CategoryProof cat="Chiffre d'affaires" ex="CA 2024 : 45M€ — Division Europe du Sud" />
            <CategoryProof cat="Taille d'équipe" ex="Équipe de 35 commerciaux + 5 managers" />
            <CategoryProof cat="P&L" ex="P&L 12M€ — Marge opérationnelle 22%" />
            <CategoryProof cat="Croissance" ex="+35% CA en 3 ans — Marché français" />
            <CategoryProof cat="Pays" ex="Lancement filiales Belgique, Suisse, Luxembourg" />
            <CategoryProof cat="Outils/Process" ex="Déploiement Salesforce — 80 utilisateurs" />
            <CategoryProof cat="Certification" ex="PMP, Green Belt Lean Six Sigma" />
            <CategoryProof cat="Prix/Reconnaissance" ex="Top 100 Leaders Commerciaux 2024" />
          </div>
          {btn("Aller au Proof Vault", "/proof-vault")}
        </Section>

        {/* 5. Opportunités & Market Radar */}
        <Section id="opportunites" icon={Search} title="5. Opportunités & Market Radar">
          <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Comment chercher</h4>
          <ul className="space-y-1 mt-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <li>• Utiliser les sources configurées (LinkedIn, APEC, Indeed, etc.)</li>
            <li>• Copier-coller le texte complet de l&apos;offre dans ELTON OS</li>
            <li>• Le système extrait automatiquement titre, entreprise, localisation</li>
            <li>• La détection de doublons évite de postuler deux fois à la même offre</li>
          </ul>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Comment éviter les doublons</h4>
          <ul className="space-y-1 mt-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <li>• ELTON OS compare automatiquement les nouvelles offres avec celles existantes</li>
            <li>• Score de similarité sur 100 (titre, entreprise, localisation, description)</li>
            <li>• Badge sur l&apos;offre : Unique, Similaire, Doublon probable, Doublon confirmé</li>
            <li>• Si doublon confirmé, une offre canonique est désignée mais les deux sources sont conservées</li>
            <li>• Alerte si une candidature est déjà liée à une offre similaire</li>
          </ul>
          {btn("Aller aux Opportunités", "/opportunites")}
        </Section>

        {/* 6. Analyse & Scoring */}
        <Section id="analyse" icon={Brain} title="6. Analyse & Scoring">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Le score (0-100)</h4>
              <ul className="space-y-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                <li className="flex items-center gap-2"><span style={{ color: "var(--succes)" }}>85-100</span> Excellent match — postuler rapidement</li>
                <li className="flex items-center gap-2"><span style={{ color: "var(--or)" }}>70-84</span> Bon match — quelques gaps mineurs</li>
                <li className="flex items-center gap-2"><span style={{ color: "var(--warning)" }}>50-69</span> Match partiel — gaps significatifs</li>
                <li className="flex items-center gap-2"><span style={{ color: "var(--erreur)" }}>&lt;50</span> Faible — probablement pas prioritaire</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Les gaps</h4>
              <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                Compétences ou expériences demandées dans l&apos;offre mais absentes de votre profil.
                Les gaps ne sont <strong>jamais</strong> inventés dans les documents.
                Ils sont listés dans l&apos;analyse pour que vous puissiez les adresser consciemment.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Les risques</h4>
              <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                Drapeaux rouges : turnover élevé, flou sur le périmètre, exigences contradictoires,
                localisation imprécise, absence de fourchette salariale, etc.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Stratégies recommandées</h4>
              <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                L&apos;analyse propose une stratégie : postuler directement, contacter un chasseur,
                activer le réseau, ou surveiller sans postuler.
              </p>
            </div>
          </div>
          {btn("Aller à l'Analyse", "/analyse")}
        </Section>

        {/* 7. Documents */}
        <Section id="documents" icon={FileText} title="7. Documents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <DocTypeCard icon={FileText} title="CV adapté" desc="CV optimisé pour l'offre. Les compétences et réalisations sont réorganisées pour matcher les exigences. Aucune information inventée." />
            <DocTypeCard icon={FileText} title="Lettre de motivation" desc="Lettre personnalisée basée sur votre profil, l'offre et les preuves du Vault." />
            <DocTypeCard icon={Send} title="Email de candidature" desc="Email court et percutant. Prêt à copier-coller dans votre client email." />
            <DocTypeCard icon={Globe} title="Message LinkedIn" desc="Message pour contacter le recruteur ou le hiring manager sur LinkedIn." />
            <DocTypeCard icon={CheckCircle2} title="Check ATS" desc="Vérifie la compatibilité du document avec les ATS (Applicant Tracking Systems)." />
            <DocTypeCard icon={Copy} title="ChangeLog" desc="Historique des modifications apportées au document, avec justification pour chaque changement." />
          </div>
          <div className="p-3 rounded-md border mt-3 text-xs" style={{ borderColor: "var(--avertissement)", background: "rgba(239,68,68,0.05)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--avertissement)" }}>
              <AlertTriangle size={14} />
              <strong>Validation humaine obligatoire</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              Aucun document ne peut être marqué comme &quot;prêt à envoyer&quot; sans avoir été relu et approuvé par vous.
              ELTON OS ne postule jamais à votre place.
            </p>
          </div>
          <div className="p-3 rounded-md border mt-2 text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--succes)" }}>
              <Shield size={14} />
              <strong>Anti-hallucination</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              Toute information dans un document doit provenir soit du Profil, du CV Maître, ou du Proof Vault.
              Les compétences manquantes (gaps) ne sont jamais ajoutées au CV — elles restent dans l&apos;analyse.
            </p>
          </div>
          {btn("Aller aux Documents", "/documents")}
        </Section>

        {/* 8. Pipeline & Relances */}
        <Section id="pipeline" icon={Columns} title="8. Pipeline & Relances">
          <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Statuts du pipeline</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs font-mono">
            {["Nouveau → À analyser → À préparer → Prêt à envoyer → Envoyé → Relance 1 → Relance 2 → Entretien RH → Entretien Direction → Offre → Refus → Archive"].map(s => (
              <span key={s} className="px-2 py-1 rounded border" style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-secondaire)" }}>{s.trim()}</span>
            ))}
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Relances</h4>
          <div className="space-y-2 mt-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <Card color="var(--or)">
              <strong style={{ color: "var(--texte)" }}>Relance J+5</strong>
              <p>Envoyée 5 jours après la candidature. Ton : courtois, rappel de l&apos;intérêt, demande de confirmation de réception.</p>
            </Card>
            <Card color="var(--info)">
              <strong style={{ color: "var(--texte)" }}>Relance J+10</strong>
              <p>Envoyée 10 jours après. Ton : plus insistant, mise en avant d&apos;un point différenciant.</p>
            </Card>
          </div>
          <div className="p-3 rounded-md border mt-3 text-xs" style={{ borderColor: "var(--avertissement)", background: "rgba(239,68,68,0.05)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--avertissement)" }}>
              <AlertTriangle size={14} />
              <strong>Pas d&apos;envoi automatique</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              ELTON OS génère le texte des relances. Vous copiez, vous collez dans votre email/LinkedIn, vous envoyez manuellement.
            </p>
          </div>
          {btn("Aller au Pipeline", "/pipeline")}
        </Section>

        {/* 9. Interview War Room */}
        <Section id="interview" icon={Calendar} title="9. Interview War Room">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            24 sections de préparation générées à partir de votre profil, l&apos;offre et l&apos;analyse.
            Aucune IA nécessaire — tout est basé sur vos données réelles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-xs">
            <SectionGroup title="Pitchs" items={["Pitch 30 secondes", "Pitch 2 minutes", "Pitch DC", "Pitch CM", "Pitch DNV", "Pitch DG"]} />
            <SectionGroup title="Préparation" items={["Résumé entreprise", "Enjeux du poste", "Pourquoi ce poste", "Pourquoi moi", "Questions RH/Mgr/DG"]} />
            <SectionGroup title="Maîtrise" items={["Réponses STAR", "Objections", "Questions à poser", "Négociation", "Points forts/faibles", "Checklist"]} />
          </div>
          {btn("Aller aux Entretiens", "/entretiens")}
        </Section>

        {/* 10. Paramètres IA & Confidentialité */}
        <Section id="parametres" icon={Settings} title="10. Paramètres IA & Confidentialité">
          <div className="space-y-3 mt-2">
            <Card color="var(--succes)">
              <h4 style={{ color: "var(--succes)" }}>Mode local (par défaut)</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                ELTON OS fonctionne entièrement sans IA externe. Tous les templates de documents, relances et préparations
                d&apos;entretien sont générés localement à partir de vos données.
              </p>
            </Card>
            <Card color="var(--or)">
              <h4 style={{ color: "var(--or)" }}>DeepSeek (optionnel)</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Vous pouvez connecter DeepSeek pour des analyses plus fines. La clé API est chiffrée et jamais affichée
                après sauvegarde. DeepSeek n&apos;est pas requis pour utiliser ELTON OS.
              </p>
            </Card>
            <Card color="var(--info)">
              <h4 style={{ color: "var(--info)" }}>Anonymisation</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Activez l&apos;anonymisation du nom, email, téléphone, entreprises et salaire avant d&apos;envoyer
                des données à une IA externe. Les données sensibles sont remplacées par des placeholders.
              </p>
            </Card>
            <Card color="var(--texte-tertiaire)">
              <h4 style={{ color: "var(--texte)" }}>Fallback local</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Si l&apos;IA externe échoue ou est indisponible, ELTON OS bascule automatiquement sur les templates locaux.
                Vous n&apos;êtes jamais bloqué.
              </p>
            </Card>
          </div>
          {btn("Aller aux Paramètres", "/parametres")}
        </Section>

        {/* 11. Templates CV */}
        <Section id="templates" icon={FileText} title="11. Templates CV">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS inclut 8 templates CV internes originaux, inspirés des bonnes pratiques ATS et executive.
            Aucun template commercial n&apos;a été copié.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <TemplateGuideCard name="ATS Classic" usage="Première candidature, grands groupes" ats="HIGH" desc="Sobre, structuré, compatible tous ATS. Priorité à la lisibilité machine." />
            <TemplateGuideCard name="Executive Premium" usage="Postes Direction, comités exécutifs" ats="MEDIUM" desc="Mise en page exécutive, focus résultats chiffrés, leadership." />
            <TemplateGuideCard name="Corporate France" usage="Entreprises françaises, CAC 40, ETI" ats="HIGH" desc="Format français classique, photo optionnelle, sections standardisées." />
            <TemplateGuideCard name="International EN" usage="Postes internationaux, multinationales" ats="HIGH" desc="Format anglo-saxon, summary, core competencies, professional experience." />
            <TemplateGuideCard name="Country Manager" usage="Postes Country Manager, DG filiale" ats="MEDIUM" desc="Focus P&L, lancement pays, gestion filiale, multilinguisme." />
            <TemplateGuideCard name="Sales Leadership" usage="Directeur Commercial, Head of Sales" ats="MEDIUM" desc="CA, croissance, taille équipe, secteurs, transformation commerciale." />
            <TemplateGuideCard name="Luxe / Premium" usage="Secteur luxe, premium, hospitality" ats="MEDIUM" desc="Design épuré premium, focus marques, expérience client, excellence." />
            <TemplateGuideCard name="One-Page Executive Brief" usage="Réseau, cabinet, approche directe" ats="LOW" desc="Synthèse une page, impact immédiat, pour recommandation ou premier contact." />
          </div>
          {btn("Voir les templates CV", "/documents/templates")}
        </Section>

        {/* 12. Benchmark */}
        <Section id="benchmark" icon={TrendingUp} title="12. Benchmark outils existants">
          <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            Synthèse non commerciale — à titre informatif.
          </p>
          <div className="space-y-2 mt-3">
            <BenchmarkRow name="Teal" features="Tracking candidatures, extension navigateur, resume tailoring" />
            <BenchmarkRow name="Jobscan" features="ATS scoring, optimisation mots-clés" />
            <BenchmarkRow name="Simplify" features="AI resume builder, job tracker, autofill" />
            <BenchmarkRow name="Careerflow" features="LinkedIn optimisation, ATS checker, job tracker" />
            <BenchmarkRow name="Jobright" features="Matching IA, autofill, insider connections" />
            <BenchmarkRow name="Reactive Resume" features="Open source resume builder, multi-langues" />
            <BenchmarkRow name="JSON Resume" features="Standard ouvert, thèmes communautaires" />
            <BenchmarkRow name="OpenResume" features="Open source resume builder/parser" />
            <BenchmarkRow name="FlowCV" features="Templates et builder simple" />
          </div>

          <h4 className="text-sm font-bold mt-5" style={{ color: "var(--or)" }}>Ce qu&apos;ELTON OS fait mieux</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
            {[
              "Local-first : aucune donnée ne quitte votre machine",
              "Proof Vault : chaque affirmation est traçable",
              "Anti-hallucination : aucune information inventée",
              "Scoring exécutif : adapté aux postes de direction",
              "Multilingue : FR/EN natif dans tous les documents",
              "Pipeline Kanban : 14 colonnes de suivi",
              "Relances : templates J+5, J+10, LinkedIn, cabinet",
              "Interview War Room : 24 sections sans IA",
              "Détection doublons : évite de postuler 2 fois",
              "Validation humaine : rien ne part sans votre accord",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} />
                <span style={{ color: "var(--texte-secondaire)" }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 13. Détection de doublons */}
        <Section id="doublons" icon={GitCompare} title="13. Détection de doublons">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS détecte automatiquement les offres similaires pour éviter de postuler deux fois
            au même poste. La détection utilise une comparaison normalisée du titre, de l&apos;entreprise,
            de la localisation et de la description.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Comment ça marche</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Card color="var(--info)">
              <h4 style={{ color: "var(--info)" }}>1. Normalisation</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Titre, entreprise et localisation sont normalisés : accents, abréviations, variations.
                <em>Ex : &quot;Dir. Commercial&quot; et &quot;Directeur Commercial&quot; deviennent identiques.</em>
              </p>
            </Card>
            <Card color="var(--or)">
              <h4 style={{ color: "var(--or)" }}>2. Empreinte de description</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Les 20 mots-clés les plus significatifs sont extraits pour créer une empreinte comparable,
                sans dépendre du texte exact de l&apos;offre.
              </p>
            </Card>
            <Card color="var(--succes)">
              <h4 style={{ color: "var(--succes)" }}>3. Score de similarité</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Score de 0 à 100 basé sur la similarité de Jaccard entre les empreintes
                et la correspondance exacte des champs normalisés.
              </p>
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Statuts de doublon</h4>
          <div className="space-y-2 mt-2 text-xs">
            <Card color="var(--succes)">
              <strong style={{ color: "var(--succes)" }}>Unique</strong> — Aucune offre similaire détectée. Score &lt; 20.
            </Card>
            <Card color="var(--or)">
              <strong style={{ color: "var(--or)" }}>Similaire</strong> — Une ou plusieurs offres proches existent. Score 20-50.
            </Card>
            <Card color="var(--warning)">
              <strong style={{ color: "var(--warning)" }}>Doublon probable</strong> — Très forte similarité. Score 50-80.
            </Card>
            <Card color="var(--erreur)">
              <strong style={{ color: "var(--erreur)" }}>Doublon confirmé</strong> — Même offre, source différente. Score &gt; 80. Une offre canonique est désignée.
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Fonctionnalités</h4>
          <ul className="space-y-1 mt-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Scan automatique à l&apos;ajout d&apos;une nouvelle offre</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Bouton &quot;Scanner les doublons&quot; pour lancer un scan complet</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Comparaison côte à côte de deux offres avec score détaillé</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Marquage manuel : &quot;Doublon&quot; ou &quot;Distinct&quot;</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Alerte si une offre en doublon a une candidature active dans le pipeline</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Filtre par statut de doublon dans la liste des opportunités</li>
          </ul>

          <div className="p-3 rounded-md border mt-3 text-xs" style={{ borderColor: "var(--or)", background: "rgba(245,158,11,0.05)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--or)" }}>
              <Star size={14} />
              <strong>Bonne pratique</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              Lancez un scan complet une fois par semaine. Même si la détection est automatique à l&apos;ajout,
              un scan périodique peut révéler des doublons entre offres ajoutées à des moments différents.
            </p>
          </div>
          {btn("Aller aux Opportunités", "/opportunites")}
        </Section>

        {/* 14. Sauvegarde locale */}
        <Section id="sauvegarde" icon={Download} title="14. Sauvegarde locale">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            Toutes vos données ELTON OS sont stockées localement dans une base SQLite.
            Vous pouvez exporter l&apos;intégralité de vos données en un clic pour les sauvegarder
            ou les transférer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Card color="var(--succes)">
              <h4 style={{ color: "var(--succes)" }}>Emplacement de la base</h4>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-secondaire)" }}>
                prisma/dev.db
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                Base SQLite locale. Jamais envoyée sur un serveur externe.
                Contient toutes les données : profil, opportunités, documents, analyses, pipeline.
              </p>
            </Card>
            <Card color="var(--info)">
              <h4 style={{ color: "var(--info)" }}>Export JSON complet</h4>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Depuis la page Paramètres, cliquez sur &quot;Exporter tout (JSON)&quot;.
                Un fichier .json est téléchargé avec :
              </p>
              <ul className="space-y-0.5 mt-1 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                <li>• Profil exécutif</li>
                <li>• CV Maître</li>
                <li>• Proof Vault (toutes les preuves)</li>
                <li>• Opportunités (avec statuts doublons)</li>
                <li>• Documents générés</li>
                <li>• Pipeline, relances, entretiens</li>
                <li>• Analyses, prompts IA, sources</li>
              </ul>
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Sécurité de l&apos;export</h4>
          <ul className="space-y-1 mt-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> La clé API est automatiquement <strong>supprimée</strong> de l&apos;export</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Le champ <code>hasApiKey</code> indique si une clé était configurée (sans la révéler)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} style={{ color: "var(--succes)", marginTop: 2 }} /> Les données d&apos;anonymisation sont préservées si activées</li>
          </ul>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Bonnes pratiques de sauvegarde</h4>
          <div className="space-y-2 mt-2">
            <Card color="var(--or)">
              <strong style={{ color: "var(--texte)" }}>Sauvegarde hebdomadaire</strong>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Exportez vos données chaque semaine. Conservez les exports dans un dossier sécurisé
                (cloud chiffré, disque externe).
              </p>
            </Card>
            <Card color="var(--info)">
              <strong style={{ color: "var(--texte)" }}>Avant mise à jour</strong>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Faites un export avant toute mise à jour d&apos;ELTON OS ou de ses dépendances.
                En cas de problème, vos données sont récupérables.
              </p>
            </Card>
            <Card color="var(--texte-tertiaire)">
              <strong style={{ color: "var(--texte)" }}>Transfert entre machines</strong>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                L&apos;export JSON permet de transférer vos données vers une autre installation d&apos;ELTON OS.
                Copiez également le fichier <code>prisma/dev.db</code> pour une migration complète.
              </p>
            </Card>
          </div>

          <div className="p-3 rounded-md border mt-3 text-xs" style={{ borderColor: "var(--avertissement)", background: "rgba(239,68,68,0.05)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--avertissement)" }}>
              <AlertTriangle size={14} />
              <strong>Important</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              La base SQLite (<code>prisma/dev.db</code>) est le fichier le plus important.
              Sauvegardez-le régulièrement. Sans lui, toutes vos données sont perdues.
              L&apos;export JSON est un format lisible et portable, mais la base SQLite reste la source
              de vérité pour ELTON OS.
            </p>
          </div>
          {btn("Aller aux Paramètres", "/parametres")}
        </Section>

        {/* 15. Tests automatisés */}
        <Section id="tests" icon={FlaskConical} title="15. Tests automatisés">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS dispose d&apos;une suite de tests unitaires (Vitest) et de tests E2E (Playwright) pour garantir la fiabilité des fonctions critiques et des parcours utilisateur.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Commandes disponibles</h4>
          <div className="space-y-2 mt-2 text-xs">
            <Card color="var(--or)">
              <strong style={{ color: "var(--texte)" }}>npm run test</strong>
              <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Lance les 280 tests unitaires Vitest couvrant : déduplication d&apos;offres, templates CV, relances, anti-hallucination, export JSON, quality-check, exports professionnels, performances, onboarding, IA.
              </p>
            </Card>
            <Card color="var(--info)">
              <strong style={{ color: "var(--texte)" }}>npm run test:watch</strong>
              <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Mode watch : relance automatiquement les tests à chaque modification de fichier.
              </p>
            </Card>
            <Card color="var(--succes)">
              <strong style={{ color: "var(--texte)" }}>npm run test:e2e</strong>
              <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Lance Playwright pour 4 suites E2E : smoke des 17 routes, test-flow données démo, parcours candidature complet, et sécurité. Le serveur de dev est démarré automatiquement.
              </p>
            </Card>
            <Card color="var(--texte-tertiaire)">
              <strong style={{ color: "var(--texte)" }}>npm run test:e2e:ui</strong>
              <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Interface graphique Playwright pour explorer les tests, voir les traces, et déboguer pas à pas.
              </p>
            </Card>
            <Card color="var(--texte-tertiaire)">
              <strong style={{ color: "var(--texte)" }}>npm run build</strong>
              <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Compile le projet Next.js et exécute le typecheck TypeScript. Le build doit toujours rester vert.
              </p>
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Installation Playwright</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Avant le premier lancement des tests E2E, installez les navigateurs :
          </p>
          <div className="p-2 mt-1 rounded font-mono text-xs" style={{ background: "var(--fond-surface)", color: "var(--or)" }}>
            npx playwright install chromium
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Suites E2E (4 fichiers)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>e2e/routes-smoke.spec.ts</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Teste les 17 routes principales : GET 200, rendu visible, aucune erreur console. Vérifie aussi la sidebar.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>e2e/test-flow-demo.spec.ts</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Teste la checklist interactive : création/suppression données démo, cocher/décocher étapes, persistance localStorage, notes, progression.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>e2e/application-flow.spec.ts</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Parcourt le flux candidature complet : données démo → opportunités → analyse → documents → pipeline → performance. Nettoyage automatique.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>e2e/safety.spec.ts</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Vérifie qu&apos;aucun envoi automatique n&apos;est fait, que la clé API est masquée, que DeepSeek est optionnel, et que la validation humaine est requise.</p>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Tests unitaires (Vitest)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Détection doublons</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Normalisation des titres, entreprises, localisations. Score de similarité Jaccard. Seuils UNIQUE/SIMILAR/PROBABLE_DUPLICATE/CONFIRMED_DUPLICATE.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Templates CV (8)</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Vérifie que chaque template existe, produit du texte et du HTML valide, contient les sections clés, et respecte le niveau ATS.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Relances (10 templates)</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Vérifie que les 10 templates FR/EN existent, contiennent les infos candidat, et qu&apos;aucune fonction d&apos;envoi automatique n&apos;existe.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Anti-hallucination</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Vérifie que les compétences absentes, diplômes inventés, entreprises inventées, chiffres inventés et technologies non listées n&apos;apparaissent JAMAIS dans les CV générés.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Export JSON</p>
              <p style={{ color: "var(--texte-secondaire)" }}>Vérifie que la clé API est supprimée, que hasApiKey est correct, et que tous les champs requis sont présents.</p>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Checklist interactive (/test-flow)</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            La page /test-flow offre une checklist interactive de 17 étapes pour tester manuellement le parcours complet.
            Chaque étape est cochable, peut recevoir une note ou un signalement de bug.
            L&apos;état est sauvegardé dans le navigateur (localStorage).
            Un bouton &quot;Créer données démo&quot; génère des données fictives marquées [DEMO] pour tester sans polluer vos données réelles.
          </p>
          {btn("Aller au Test flow", "/test-flow")}
        </Section>

        {/* 16. Passage en usage réel */}
        <Section id="usage-reel" icon={Target} title="16. Passage en usage réel">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS est livré avec des données de démonstration. Voici les 12 étapes pour passer
            en usage réel avec vos propres candidatures.
          </p>

          <div className="p-3 rounded-md border mb-3 text-xs" style={{ borderColor: "var(--avertissement)", background: "rgba(239,68,68,0.05)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--avertissement)" }}>
              <AlertTriangle size={14} />
              <strong>Avant de commencer</strong>
            </div>
            <p className="mt-1" style={{ color: "var(--texte-secondaire)" }}>
              Faites un export JSON de vos données de test depuis Paramètres &gt; Données &gt; Export.
              Si vous avez des données [DEMO], supprimez-les depuis /test-flow &gt; Supprimer données démo.
            </p>
          </div>

          <StepList steps={[
            { num: "1", title: "Sauvegarder les données", desc: "Allez dans Paramètres > Données > Exporter JSON. Gardez ce fichier comme sauvegarde de référence.", path: "/parametres" },
            { num: "2", title: "Remplir le vrai profil", desc: "Complétez votre profil exécutif complet : nom, titre, pays cibles, secteurs, langues, certifications.", path: "/profil" },
            { num: "3", title: "Importer le vrai CV Maître", desc: "Uploadez votre CV complet actuel au format PDF, DOCX ou TXT. C'est la source qui alimentera toutes les générations.", path: "/cv-maitre" },
            { num: "4", title: "Ajouter les preuves réelles", desc: "Pour chaque réalisation chiffrée, ajoutez une preuve dans le Proof Vault. Sans Proof Vault, les templates ne peuvent pas citer de chiffres.", path: "/proof-vault" },
            { num: "5", title: "Ajouter 5 offres réelles", desc: "Ajoutez vos 5 premières offres cibles (Directeur Commercial, Country Manager, etc.). Collez le texte complet de chaque annonce.", path: "/opportunites" },
            { num: "6", title: "Analyser les offres", desc: "Lancez l'analyse de chaque offre. Vérifiez le scoring (score global, gaps, risques, points forts).", path: "/analyse" },
            { num: "7", title: "Choisir les meilleures", desc: "Utilisez le tableau de priorisation pour classer les offres par score, fit international, leadership et risque.", path: "/opportunites" },
            { num: "8", title: "Générer les documents", desc: "Pour chaque offre prioritaire, générez CV adapté + lettre + email au format FR ou EN selon le pays.", path: "/documents" },
            { num: "9", title: "Relire et valider", desc: "Utilisez l'assistant qualité (/quality-check) pour évaluer chaque document. Relisez les alertes anti-hallucination. Passez en APPROVED.", path: "/quality-check" },
            { num: "10", title: "Ajouter au pipeline", desc: "Ajoutez l'opportunité au pipeline, renseignez le contact recruteur et la date de prochaine étape.", path: "/pipeline" },
            { num: "11", title: "Relancer", desc: "Générez une relance J+5 ou J+10. Copiez le texte, envoyez-le vous-même, puis marquez la relance comme envoyée.", path: "/pipeline" },
            { num: "12", title: "Préparer l'entretien", desc: "Quand un entretien est programmé, créez une préparation avec pitch, questions, STAR et grille d'évaluation.", path: "/entretiens" },
          ]} />

          <p className="text-xs mt-3" style={{ color: "var(--texte-tertiaire)" }}>
            Conseil : traitez 2-3 offres par jour maximum. La qualité de chaque candidature compte plus que la quantité.
            Un document bien préparé avec des preuves chiffrées a 10x plus d&apos;impact qu&apos;un envoi standardisé.
          </p>
        </Section>

        {/* 17. Assistant qualité */}
        <Section id="qualite" icon={ClipboardCheck} title="17. Assistant qualité candidature">
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            L&apos;assistant qualité (/quality-check) évalue automatiquement vos documents avant envoi selon 10 critères.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Les 10 critères</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs">
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Clarté</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Longueur de phrases (15-25 mots), paragraphes, lisibilité.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Crédibilité</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Chiffres vérifiables, diplômes attestés, absence de superlatifs douteux.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Personnalisation</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Mention du poste, de l&apos;entreprise, du candidat.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Preuves</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Résultats chiffrés (%, montants, tailles d&apos;équipe), verbes d&apos;accomplissement.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Ton humain</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Absence de formules administratives, style naturel et direct.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Mots-clés ATS</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Densité de termes management, commercial, stratégie, international.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Zéro invention</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Aucune compétence, diplôme ou chiffre non vérifié.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Phrases spécifiques</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Détection des banalités (« passionné », « rigoureux », « esprit d&apos;équipe »).</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Niveau exécutif</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Vocabulaire P&L, stratégie, board, international — pas de termes opérationnels.</p>
            </div>
            <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-bold" style={{ color: "var(--or)" }}>Longueur adaptée</p>
              <p style={{ color: "var(--texte-tertiaire)" }}>Ni trop court ni trop long selon le type de document.</p>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Comment utiliser</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li>Générez un document depuis une opportunité.</li>
            <li>Copiez le contenu du document.</li>
            <li>Allez dans /quality-check et collez le texte.</li>
            <li>Ajoutez le contexte (poste, entreprise) pour un score plus précis.</li>
            <li>Cliquez « Analyser la qualité ».</li>
            <li>Corrigez les phrases trop génériques et les éléments risqués.</li>
            <li>Répétez jusqu&apos;à obtenir un score ≥ 70.</li>
          </ol>

          <p className="text-xs mt-2" style={{ color: "var(--texte-tertiaire)" }}>
            L&apos;évaluation est 100% locale, sans IA, sans envoi de données. Le score est indicatif :
            un document avec un score de 65 peut être excellent si le contenu est pertinent.
            Utilisez votre jugement en dernier ressort.
          </p>
          {btn("Aller à l'assistant qualité", "/quality-check")}
        </Section>

        {/* ── Section 18 — Exports professionnels ──── */}
        <Section id="exports" icon={Download} title="18. Exports professionnels PDF, DOCX, TXT et dossier candidature">

          <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Formats d&apos;export disponibles</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>PDF (impression)</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Ouvre l&apos;aperçu avant impression du navigateur. Utilisez Ctrl+P / Cmd+P pour enregistrer en PDF.
                Format A4, marges 20mm, polices Arial/Helvetica. Idéal pour l&apos;envoi aux cabinets et RH.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Nécessite APPROVED</p>
            </div>

            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>DOCX (Word)</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Génère un vrai fichier .docx avec titres, paragraphes, listes à puces et marges 2,5 cm.
                Compatible Word, Google Docs, LibreOffice. Format recommandé pour les ATS récents.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Nécessite APPROVED</p>
            </div>

            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>TXT (texte brut)</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Export texte simple avec en-tête ELTON OS. Si le document n&apos;est pas approuvé, un watermark BROUILLON
                est ajouté automatiquement. Utile pour un copier-coller rapide ou pour les ATS legacy.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Disponible même en BROUILLON</p>
            </div>

            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>ATS TXT</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Version optimisée pour les ATS : suppression des accents, guillemets courbes, caractères spéciaux Unicode,
                et normalisation des sauts de ligne. Maximise le taux de parsing correct par les robots RH.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>ASCII pur, toujours disponible</p>
            </div>

            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Markdown</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Export en format Markdown avec titre et métadonnées. Utile si vous publiez sur un site statique
                ou si vous voulez une version lisible dans un éditeur de texte.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Toujours disponible</p>
            </div>

            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Dossier candidature (.zip)</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Export groupé depuis /opportunites/[id]. Contient : résumé stratégie, analyse offre, CV/Lettres/Emails/LinkedIn/ATS
                organisés en dossiers. Les documents non approuvés sont préfixés BROUILLON_.
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Depuis la page opportunité</p>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Blocage des exports — règle de validation humaine</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Card color="var(--succes)">
              <span className="font-bold">APPROVED</span> — Exports PDF, DOCX, TXT, ATS, Markdown, Dossier ZIP disponibles sans restriction.
            </Card>
            <Card color="var(--or)">
              <span className="font-bold">DRAFT / NEEDS_REVIEW</span> — Seul TXT (avec watermark BROUILLON) et ATS TXT sont disponibles.
              PDF et DOCX sont bloqués.
            </Card>
            <Card color="var(--erreur)">
              <span className="font-bold">REJECTED</span> — Tous les exports finaux sont bloqués. Seul ATS TXT accessible.
            </Card>
          </div>

          <p className="text-xs mt-2" style={{ color: "var(--texte-tertiaire)" }}>
            Cette règle garantit qu&apos;aucun document non relu humainement ne peut être exporté en PDF ou DOCX.
            ELTON OS ne vous laisse pas envoyer un document sans relecture.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Quand utiliser quel format</h4>

          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-20 flex-shrink-0" style={{ color: "var(--or)" }}>Cabinet RH</span>
              <span style={{ color: "var(--texte-secondaire)" }}>PDF ou DOCX. Le PDF est plus propre visuellement ; le DOCX est parfois exigé.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-20 flex-shrink-0" style={{ color: "var(--or)" }}>Portail ATS</span>
              <span style={{ color: "var(--texte-secondaire)" }}>ATS TXT ou DOCX. L&apos;ATS TXT maximise la lisibilité machine. Certains ATS acceptent le DOCX.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-20 flex-shrink-0" style={{ color: "var(--or)" }}>Email direct</span>
              <span style={{ color: "var(--texte-secondaire)" }}>PDF. Copiez-collez l&apos;email depuis le document, attachez le PDF.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-20 flex-shrink-0" style={{ color: "var(--or)" }}>Archive perso</span>
              <span style={{ color: "var(--texte-secondaire)" }}>Dossier ZIP. Export complet depuis l&apos;opportunité pour archivage local.</span>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Comment nommer les fichiers</h4>

          <ul className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li>Les fichiers sont nommés automatiquement : <code className="font-mono" style={{ color: "var(--or)" }}>TypeDoc_Entreprise_Titre_Date.ext</code></li>
            <li>Exemple : <code className="font-mono" style={{ color: "var(--or)" }}>CV_FR_TechCorp_DirecteurCommercial_20260619.pdf</code></li>
            <li>Les caractères spéciaux et accents sont supprimés pour la compatibilité multiplateforme.</li>
            <li>Le dossier ZIP suit le format : <code className="font-mono" style={{ color: "var(--or)" }}>ELTON_OS_Candidature_Entreprise_Titre_Date.zip</code></li>
            <li>Vous pouvez renommer les fichiers après téléchargement, mais conservez la date et le nom de l&apos;entreprise.</li>
          </ul>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Workflow recommandé</h4>

          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li>Générez vos documents depuis l&apos;opportunité (CV, lettre, emails, LinkedIn).</li>
            <li>Relisez chaque document humainement.</li>
            <li>Passez le CV à l&apos;assistant qualité (/quality-check) — visez un score ≥ 70.</li>
            <li>Approuvez le document (statut → APPROVED).</li>
            <li>Exportez en PDF ou DOCX depuis la page du document.</li>
            <li>Téléchargez le dossier ZIP complet depuis la page opportunité pour archivage.</li>
          </ol>

          <p className="text-xs mt-2" style={{ color: "var(--texte-tertiaire)" }}>
            Aucun document n&apos;est envoyé automatiquement. Les exports sont téléchargés sur votre poste ;
            c&apos;est vous qui décidez quand et comment les transmettre.
          </p>
        </Section>

        {/* ── Section 19 — Piloter sa recherche ──── */}
        <Section id="pilotage" icon={TrendingUp} title="19. Piloter sa recherche d&apos;emploi">

          <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Lire les KPIs</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            La page /performance affiche tous les indicateurs clés de votre recherche. Voici comment les interpréter :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Score moyen</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                La moyenne des scores de toutes vos offres. ≥ 70 = bon ciblage. &lt; 50 = élargissez ou changez de sources.
              </p>
            </div>
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Taux de réponse</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Pourcentage de candidatures ayant reçu une réponse (entretien, offre ou refus).
                ≥ 30% = bon. ≥ 50% = excellent. 0% = revoyez le message et le ciblage.
              </p>
            </div>
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Taux d&apos;entretien</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Candidatures ayant abouti à un entretien. ≥ 20% = les documents sont efficaces.
                ≥ 30% = vous êtes dans le top 5% des candidats.
              </p>
            </div>
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--or)" }}>Offres à éviter</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Score ≤ 30/100. Archivez-les pour libérer du temps et réduire le bruit statistique.
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Routine du matin (30 minutes)</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li><strong style={{ color: "var(--texte)" }}>Ouvrir /performance</strong> — regarder la section « Aujourd&apos;hui ».</li>
            <li><strong style={{ color: "var(--texte)" }}>Traiter les alertes rouges</strong> (priorité haute) : offres high priority non traitées, relances en retard, candidatures prêtes à envoyer.</li>
            <li><strong style={{ color: "var(--texte)" }}>Ajouter de nouvelles offres</strong> — 15 minutes de prospection sur vos 3 meilleures sources.</li>
            <li><strong style={{ color: "var(--texte)" }}>Vérifier les doublons</strong> — la section « Aujourd&apos;hui » vous les signale.</li>
            <li><strong style={{ color: "var(--texte)" }}>Lire les recommandations hebdomadaires</strong> — elles s&apos;actualisent automatiquement.</li>
          </ol>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Routine de l&apos;après-midi (45 minutes)</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li><strong style={{ color: "var(--texte)" }}>Analyser les nouvelles offres</strong> — depuis /opportunites, lancez l&apos;analyse AI pour les offres ajoutées le matin.</li>
            <li><strong style={{ color: "var(--texte)" }}>Générer les documents</strong> — pour les offres analysées sans document, générez CV + lettre.</li>
            <li><strong style={{ color: "var(--texte)" }}>Relire et valider</strong> — passez les documents en NEEDS_REVIEW, utilisez /quality-check si score &lt; 70.</li>
            <li><strong style={{ color: "var(--texte)" }}>Approuver et exporter</strong> — documents validés → APPROVED → export PDF/DOCX.</li>
            <li><strong style={{ color: "var(--texte)" }}>Envoyer les candidatures prêtes</strong> — depuis le pipeline, cochez « Envoyé ».</li>
          </ol>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Interpréter les taux</h4>

          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-28 flex-shrink-0" style={{ color: "var(--texte)" }}>Réponse &lt; 10%</span>
              <span style={{ color: "var(--texte-secondaire)" }}>Problème de ciblage ou de message. Vérifiez la qualité du CV, la pertinence de l&apos;offre, l&apos;adéquation du profil.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-28 flex-shrink-0" style={{ color: "var(--texte)" }}>Entretien &lt; 10%</span>
              <span style={{ color: "var(--texte-secondaire)" }}>Le CV passe la barrière RH mais ne convainc pas. Améliorez les réalisations chiffrées, le Proof Vault.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-28 flex-shrink-0" style={{ color: "var(--texte)" }}>Offres reçues = 0</span>
              <span style={{ color: "var(--texte-secondaire)" }}>Si vous avez eu des entretiens mais 0 offre, travaillez la préparation d&apos;entretien (Interview War Room).</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <span className="font-bold w-28 flex-shrink-0" style={{ color: "var(--texte)" }}>Pipeline stagnant</span>
              <span style={{ color: "var(--texte-secondaire)" }}>Plus de 14 jours sans mouvement = l&apos;opportunité est bloquée. Relancez ou archivez.</span>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Ajuster la stratégie</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Card color="var(--or)">
              <span className="font-bold">Source en tête</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Intensifiez la prospection sur la source qui a le meilleur score moyen et le plus d&apos;entretiens.
              </p>
            </Card>
            <Card color="var(--info)">
              <span className="font-bold">Rôle en tête</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Adaptez votre CV maître vers le rôle le plus prometteur (score + entretiens).
              </p>
            </Card>
            <Card color="var(--succes)">
              <span className="font-bold">Pays en tête</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Priorisez les pays où le taux de transformation est le plus élevé.
              </p>
            </Card>
          </div>

          <div className="p-3 rounded-md border mt-3" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--texte)" }}>Conseil :</strong> relisez les recommandations hebdomadaires
              chaque lundi matin. Elles sont générées localement à partir de vos données — sans IA, sans envoi externe.
              La page /performance est votre tableau de bord stratégique. Consultez-la quotidiennement.
            </p>
          </div>

          {btn("Voir mes performances", "/performance")}
        </Section>

        {/* ── Section 20 — IA Premium DeepSeek ──── */}
        <Section id="ia-premium" icon={Sparkles} title="20. IA Premium DeepSeek">

          <div className="p-3 rounded-md border mb-3" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--info)" }}>DeepSeek est optionnel.</strong> ELTON OS fonctionne
              intégralement sans clé API. L&apos;IA premium est un bonus pour améliorer la qualité rédactionnelle
              — elle ne remplace jamais le jugement humain.
            </p>
          </div>

          <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Configurer DeepSeek</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li>Allez dans <strong style={{ color: "var(--texte)" }}>Paramètres → IA & Confidentialité</strong>.</li>
            <li>Saisissez votre clé API DeepSeek (obtenue sur platform.deepseek.com).</li>
            <li>Choisissez le modèle : <span className="font-mono">deepseek-v4-flash</span> (rapide) ou <span className="font-mono">deepseek-v4-pro</span> (qualité maximale).</li>
            <li>Paramétrez le timeout (recommandé : 25 secondes) et la température (recommandé : 0.4).</li>
            <li>Cliquez sur <strong style={{ color: "var(--or)" }}>Tester la connexion</strong> — vous verrez le statut en temps réel.</li>
            <li>Configurez le <strong style={{ color: "var(--texte)" }}>mode de confidentialité</strong> : local, anonymisé, ou complet.</li>
          </ol>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Card color="var(--succes)">
              <span className="font-bold">Mode Local</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Aucune donnée ne quitte votre machine. Templates purs, sans IA. Fonctionne sans clé API.
              </p>
            </Card>
            <Card color="var(--warning)">
              <span className="font-bold">Mode Anonymisé</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Le nom, l&apos;email, le téléphone, les entreprises et le salaire sont masqués avant envoi.
              </p>
            </Card>
            <Card color="var(--erreur)">
              <span className="font-bold">Mode Complet</span>
              <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                Toutes les données sont envoyées. À utiliser uniquement avec un fournisseur de confiance.
              </p>
            </Card>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Améliorer un document avec l&apos;IA</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li>Ouvrez un document (CV, lettre, email, LinkedIn).</li>
            <li>Dans la section <strong style={{ color: "var(--info)" }}>Amélioration IA Premium</strong>, choisissez un style de rédaction (10 styles disponibles : humain, corporate, direct, premium, international, luxe, cabinet, CEO/Board, reconversion, synthétique).</li>
            <li>Cliquez sur <strong style={{ color: "var(--or)" }}>Améliorer avec IA</strong> — DeepSeek reformule le contenu en conservant les faits.</li>
            <li>Le document passe automatiquement en statut <strong style={{ color: "var(--avertissement)" }}>NEEDS_REVIEW</strong> — jamais APPROVED automatiquement.</li>
            <li>Utilisez <strong style={{ color: "var(--info)" }}>Comparer local vs IA</strong> pour voir les différences côte à côte.</li>
            <li>Relisez, vérifiez les alertes anti-hallucination, et validez <strong>humainement</strong>.</li>
          </ol>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Styles de rédaction</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            10 styles exécutifs influencent le ton, le vocabulaire, la formalité et l&apos;angle business de vos documents.
            Chaque style a des instructions spécifiques envoyées à l&apos;IA :
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
            {["Humain", "Corporate", "Direct", "Premium", "International", "Luxe", "Cabinet", "CEO/Board", "Reconversion", "Synthétique"].map(s => (
              <span key={s} className="text-xs font-mono px-2 py-1 rounded text-center"
                style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>{s}</span>
            ))}
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Validation humaine obligatoire</h4>
          <div className="space-y-2 mt-2">
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--erreur)" }} />
              <span style={{ color: "var(--texte-secondaire)" }}>
                <strong style={{ color: "var(--erreur)" }}>Ne jamais envoyer un document IA sans relecture.</strong> L&apos;IA peut inventer des compétences,
                des chiffres, des diplômes ou des entreprises. Le système anti-hallucination détecte 10 types de fabrications,
                mais la relecture humaine reste indispensable.
              </span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
              <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--succes)" }} />
              <span style={{ color: "var(--texte-secondaire)" }}>
                <strong style={{ color: "var(--succes)" }}>Bonne pratique :</strong> comparez toujours la version locale avec la version IA.
                La version locale est garantie sans invention — elle est générée par des templates déterministes.
                Utilisez l&apos;IA pour le style, pas pour le fond.
              </span>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Que faire si l&apos;IA invente</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)", paddingLeft: 18 }}>
            <li><strong style={{ color: "var(--texte)" }}>Consultez les alertes</strong> — elles apparaissent en jaune sous le document amélioré.</li>
            <li><strong style={{ color: "var(--texte)" }}>Comparez avec la version locale</strong> — bouton &quot;Comparer local vs IA&quot;.</li>
            <li><strong style={{ color: "var(--texte)" }}>Éditez manuellement</strong> — corrigez les inexactitudes directement dans l&apos;éditeur.</li>
            <li><strong style={{ color: "var(--texte)" }}>Ne validez pas</strong> — tant que des alertes critiques sont présentes, l&apos;export est automatiquement bloqué.</li>
            <li><strong style={{ color: "var(--texte)" }}>Re-générez avec un autre style</strong> — certains styles produisent moins d&apos;hallucinations.</li>
            <li>Si le problème persiste, <strong style={{ color: "var(--texte)" }}>utilisez la version locale</strong> — elle est fiable et sans surprise.</li>
          </ol>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Quality Check IA</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            La page /quality-check propose désormais une option <strong style={{ color: "var(--info)" }}>DeepSeek Premium</strong>.
            L&apos;IA évalue votre document sur 5 axes (clarté, crédibilité, personnalisation, ton exécutif, impact) et
            compare son score avec l&apos;analyse locale. Les divergences importantes sont signalées pour attirer votre attention.
          </p>

          <div className="p-3 rounded-md border mt-3" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--texte)" }}>Rappel sécurité :</strong> votre clé API est stockée chiffrée dans la base locale.
              Aucune donnée n&apos;est envoyée sans votre action explicite. Le mode local reste disponible en permanence.
              ELTON OS ne dépend d&apos;aucun service externe pour fonctionner.
            </p>
          </div>

          {btn("Configurer DeepSeek", "/parametres")}
        </Section>

        <Section id="demarrage-guide" icon={Target} title="21. Démarrage guidé & Agent Readiness">
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS propose un <strong style={{ color: "var(--texte)" }}>wizard de démarrage guidé</strong> en 10 étapes
            qui configure votre agent exécutif depuis un seul écran, sans avoir à naviguer entre les différents menus.
            Le mode manuel reste disponible — le wizard est une couche optionnelle.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Différence mode guidé vs manuel</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--or)" }}>Mode guidé</p>
              <ul className="text-xs space-y-0.5 mt-1" style={{ color: "var(--texte-secondaire)" }}>
                <li>• Parcours linéaire en ~15 min</li>
                <li>• Champs pré-remplis depuis données existantes</li>
                <li>• Score Agent Readiness en temps réel</li>
                <li>• Navigation pas à pas avec sauvegarde automatique</li>
                <li>• Idéal pour la première configuration</li>
              </ul>
            </div>
            <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="text-xs font-bold" style={{ color: "var(--texte)" }}>Mode manuel</p>
              <ul className="text-xs space-y-0.5 mt-1" style={{ color: "var(--texte-secondaire)" }}>
                <li>• Navigation libre entre les menus</li>
                <li>• Chaque section indépendante</li>
                <li>• Mises à jour incrémentales</li>
                <li>• Pas de contrainte d&apos;ordre</li>
                <li>• Idéal pour les modifications ciblées</li>
              </ul>
            </div>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Score Agent Readiness</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Le score de 0 à 100% mesure la complétion de votre configuration sur 9 sections pondérées.
            Il est calculé en local, sans IA, à partir de vos données réelles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs font-mono">
            {[
              { section: "Identité", pts: 10, criteres: "Nom, titre, email, téléphone" },
              { section: "Ciblage", pts: 15, criteres: "Rôles, pays, secteurs, fonctions, années" },
              { section: "Expériences", pts: 20, criteres: "≥2 expériences, description, chiffres" },
              { section: "Compétences", pts: 10, criteres: "≥5 skills, langues renseignées" },
              { section: "CV Maître", pts: 15, criteres: "CV importé et validé" },
              { section: "Proof Vault", pts: 15, criteres: "Chiffres vérifiables, ≥3 entrées" },
              { section: "Sources", pts: 5, criteres: "Sources actives et prioritaires" },
              { section: "IA", pts: 5, criteres: "Mode configuré, clé API" },
              { section: "Pipeline", pts: 5, criteres: "≥1 opportunité dans le pipeline" },
            ].map(({ section, pts, criteres }) => (
              <div key={section} className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--texte)" }}>{section}</span>
                  <span style={{ color: "var(--or)" }}>{pts} pts</span>
                </div>
                <div className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{criteres}</div>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Statuts</h4>
          <div className="space-y-1 mt-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
            <p>• <strong style={{ color: "var(--texte-tertiaire)" }}>Non démarré</strong> : score &lt; 10% — démarrez le wizard</p>
            <p>• <strong style={{ color: "var(--or)" }}>En cours</strong> : 10-49% — continuez les étapes</p>
            <p>• <strong style={{ color: "var(--info)" }}>Presque prêt</strong> : 50-74% — les bases sont en place</p>
            <p>• <strong style={{ color: "var(--succes)" }}>Prêt</strong> : 75-89% — la plupart des fonctionnalités sont actives</p>
            <p>• <strong style={{ color: "var(--succes)" }}>Actif</strong> : ≥ 90% — agent pleinement opérationnel</p>
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Importer mes expériences depuis mon CV maître</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Dans l&apos;étape <strong style={{ color: "var(--texte)" }}>Expériences</strong> du wizard, si vous avez déjà importé un CV maître,
            vous pouvez cliquer sur <strong style={{ color: "var(--or)" }}>Scanner mon CV maître</strong>. L&apos;application détecte
            automatiquement les expériences, dates, réalisations et outils depuis le texte du CV.
          </p>
          <ul className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)" }}>
            <li>• <strong style={{ color: "var(--texte)" }}>L&apos;app propose</strong> — détection automatique depuis le CV maître</li>
            <li>• <strong style={{ color: "var(--texte)" }}>L&apos;utilisateur vérifie</strong> — chaque expérience peut être cochée, ignorée ou modifiée</li>
            <li>• <strong style={{ color: "var(--texte)" }}>Rien n&apos;est importé sans validation</strong> — confirmation avant import</li>
            <li>• <strong style={{ color: "var(--texte)" }}>Le CV maître reste intact</strong> — aucune modification</li>
            <li>• <strong style={{ color: "var(--texte)" }}>Les expériences existantes ne sont pas supprimées</strong> — les doublons sont détectés et ignorés</li>
          </ul>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Que faire après l&apos;onboarding</h4>
          <ol className="text-xs space-y-1 mt-2" style={{ color: "var(--texte-secondaire)" }}>
            <li>1. Allez sur le <strong style={{ color: "var(--texte)" }}>Dashboard</strong> pour voir votre score et vos statistiques</li>
            <li>2. Importez des <strong style={{ color: "var(--texte)" }}>opportunités</strong> depuis vos sources</li>
            <li>3. Lancez une <strong style={{ color: "var(--texte)" }}>analyse</strong> sur les offres qui vous intéressent</li>
            <li>4. Générez vos premiers <strong style={{ color: "var(--texte)" }}>documents</strong> (CV, lettre, email)</li>
            <li>5. Suivez votre progression dans le <strong style={{ color: "var(--texte)" }}>Pipeline</strong> et la page <strong style={{ color: "var(--texte)" }}>Performance</strong></li>
          </ol>

          <div className="p-3 rounded-md border mt-3" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--texte)" }}>Rappel :</strong> le démarrage guidé est entièrement optionnel.
              Toutes les fonctionnalités restent accessibles via les menus classiques. Vous pouvez commencer le wizard,
              l&apos;interrompre, et reprendre plus tard — votre progression est sauvegardée automatiquement.
            </p>
          </div>

          {btn("Lancer le démarrage guidé", "/demarrage")}
        </Section>

        <Section id="premiere-session" icon={Play} title="22. Première session réelle">
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            Une fois le démarrage guidé terminé, passez en <strong style={{ color: "var(--texte)" }}>usage réel</strong> avec
            votre vrai profil et 5 vraies offres. La page <strong style={{ color: "var(--or)" }}>First Run</strong> vous
            accompagne étape par étape avec une checklist interactive et des détections automatiques.
          </p>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Checklist des 15 étapes</h4>
          <div className="space-y-1 mt-2">
            {[
              "Supprimer les données de démonstration [DEMO]",
              "Compléter votre vrai profil exécutif (nom, titre, résumé, ciblage)",
              "Importer votre vrai CV maître (texte intégral)",
              "Ajouter au moins 5 preuves chiffrées dans le Proof Vault",
              "Marquer au moins 1 preuve comme vérifiable",
              "Ajouter votre 1ère vraie offre (manuellement ou via source)",
              "Ajouter 5 vraies offres au total",
              "Analyser toutes les offres (scoring, gaps, risques)",
              "Générer un CV adapté pour une offre (template ATS Classic)",
              "Relire et approuver le CV généré",
              "Générer et approuver une lettre de motivation",
              "Ajouter les offres au pipeline Kanban",
              "Planifier une relance J+5",
              "Générer une préparation d'entretien (24 sections)",
              "Vérifier le dashboard (KPIs à jour)",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded text-xs"
                style={{ color: "var(--texte-secondaire)" }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--or-faible)", color: "var(--or)" }}>{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Détections automatiques</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            La page First Run analyse automatiquement votre base pour détecter :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
            {[
              { label: "Données démo restantes", severity: "error" },
              { label: "CV Maître manquant", severity: "error" },
              { label: "Preuves vérifiables insuffisantes", severity: "error" },
              { label: "Moins de 5 offres réelles", severity: "warning" },
              { label: "Documents non approuvés", severity: "warning" },
              { label: "Aucune relance planifiée", severity: "warning" },
              { label: "Pipeline vide", severity: "warning" },
              { label: "Offres non analysées", severity: "warning" },
            ].map(({ label, severity }) => (
              <div key={label} className="flex items-center gap-2 p-2 rounded border"
                style={{
                  borderColor: severity === "error" ? "var(--erreur)" : "var(--avertissement)",
                  background: severity === "error" ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)",
                }}>
                <AlertTriangle size={12} style={{ color: severity === "error" ? "var(--erreur)" : "var(--avertissement)" }} />
                <span style={{ color: "var(--texte-secondaire)" }}>{label}</span>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-bold mt-4" style={{ color: "var(--texte)" }}>Score de préparation</h4>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Un score de 0 à 100% est calculé automatiquement en fonction des 8 checks automatiques :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 text-xs font-mono">
            {[
              { check: "Données démo", pts: 20 },
              { check: "CV Maître", pts: 20 },
              { check: "Offres réelles", pts: 20 },
              { check: "Proof Vault", pts: 15 },
              { check: "Docs approuvés", pts: 15 },
              { check: "Relances", pts: 10 },
              { check: "Pipeline", pts: 10 },
              { check: "Offres analysées", pts: 10 },
            ].map(({ check, pts }) => (
              <div key={check} className="p-2 rounded border text-center" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div style={{ color: "var(--texte)" }}>{check}</div>
                <div style={{ color: "var(--or)" }}>{pts} pts</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-md border mt-3" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--texte)" }}>Important :</strong> la progression de la checklist est sauvegardée
              localement dans votre navigateur (localStorage). Vous pouvez quitter et reprendre à tout moment sans perdre
              vos coches. Les détections automatiques sont recalculées à chaque visite de la page.
            </p>
          </div>

          {btn("Accéder au First Run", "/first-run")}
        </Section>

      </div>
    </div>
  );
}

/* ── Composants internes ─────────────────────────────── */

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--texte)" }}>
        <Icon size={18} style={{ color: "var(--or)" }} /> {title}
      </h2>
      {children}
    </section>
  );
}

function StepList({ steps }: { steps: { num: string; title: string; desc: string; path?: string }[] }) {
  const router = useRouter();
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
          <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--or)", color: "var(--fond)" }}>{s.num}</span>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--texte)" }}>{s.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{s.desc}</p>
            {s.path && (
              <button onClick={() => router.push(s.path!)}
                className="text-xs mt-1 flex items-center gap-1 font-mono" style={{ color: "var(--or)" }}>
                Aller à la page <ArrowRight size={10} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-md border text-xs" style={{ borderColor: color, background: `${color}0D`, borderLeftWidth: 3 }}>
      {children}
    </div>
  );
}

function FieldGuide({ field, example, tips }: { field: string; example: string; tips: string }) {
  return (
    <div className="p-3 rounded-md border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
      <p className="font-bold" style={{ color: "var(--texte)" }}>{field}</p>
      <p className="mt-0.5" style={{ color: "var(--or)" }}>Ex : {example}</p>
      <p className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{tips}</p>
    </div>
  );
}

function CategoryProof({ cat, ex }: { cat: string; ex: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded border" style={{ borderColor: "var(--bordure-douce)" }}>
      <Star size={12} style={{ color: "var(--or)", marginTop: 1 }} />
      <div>
        <span style={{ color: "var(--texte)" }}>{cat}</span>
        <br /><span style={{ color: "var(--texte-tertiaire)" }}>{ex}</span>
      </div>
    </div>
  );
}

function DocTypeCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: "var(--or)" }} />
        <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>{title}</span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{desc}</p>
    </div>
  );
}

function SectionGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
      <p className="text-xs font-bold mb-1" style={{ color: "var(--or)" }}>{title}</p>
      {items.map((item, i) => (
        <p key={i} className="text-xs" style={{ color: "var(--texte-secondaire)" }}>• {item}</p>
      ))}
    </div>
  );
}

function TemplateGuideCard({ name, usage, ats, desc }: { name: string; usage: string; ats: string; desc: string }) {
  const atsColor = ats === "HIGH" ? "var(--succes)" : ats === "MEDIUM" ? "var(--or)" : "var(--texte-tertiaire)";
  return (
    <div className="p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>{name}</span>
        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${atsColor}20`, color: atsColor }}>ATS {ats}</span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{desc}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>Quand : {usage}</p>
    </div>
  );
}

function BenchmarkRow({ name, features }: { name: string; features: string }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)" }}>
      <span className="font-bold w-28 flex-shrink-0" style={{ color: "var(--texte)" }}>{name}</span>
      <span style={{ color: "var(--texte-secondaire)" }}>{features}</span>
    </div>
  );
}
