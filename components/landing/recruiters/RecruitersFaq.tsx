"use client";

import { useState } from "react";
import Reveal from "../Reveal";

const FAQS = [
  {
    q: "Y a-t-il un droit d'entrée pour devenir Partenaire PRSTO ?",
    a: "Non. Aucun droit d'entrée, aucune royalty sur votre chiffre d'affaires de placement. Le seul coût est l'abonnement SaaS mensuel (Pro 199$ ou Elite 349$). Le statut Partenaire est inclus dans l'abonnement Elite. Pour les indépendants qui débutent, le plan Solo à 99$ vous donne accès à tous les outils sous votre propre marque.",
  },
  {
    q: "Quelle est la différence entre PRSTO et une franchise ?",
    a: "Une franchise demande 10 000 à 50 000€ de droit d'entrée, 5 à 10% de royalties sur votre CA, un engagement de 3 à 5 ans, et impose un territoire exclusif. PRSTO ne demande rien de tout ça : pas de droit d'entrée, 0% de royalties, mensuel sans engagement, aucune contrainte géographique. Vous restez libre.",
  },
  {
    q: "Puis-je afficher le logo PRSTO sur mes supports ?",
    a: "Oui, si vous êtes abonné Pro ou Elite et que vous avez signé la charte de marque. Le statut Partenaire PRSTO vous donne le droit d'utiliser notre logo en co-branding sur votre site, vos emails, vos documents générés, et votre profil LinkedIn. Vous gardez votre identité de cabinet, augmentée par la nôtre.",
  },
  {
    q: "Est-ce que PRSTO Recruteur remplace mon ATS ?",
    a: "Non. PRSTO Recruteur n'est pas un ATS. C'est un moteur de préparation de candidats qui se branche sur vos outils existants (Manatal, Recruit CRM, Excel...). On fait ce qu'aucun ATS ne fait : préparer vos candidats pour le client final.",
  },
  {
    q: "Puis-je utiliser PRSTO avec mon ATS actuel ?",
    a: "Oui. PRSTO est complémentaire. Vous continuez à gérer votre pipeline dans votre ATS, et vous utilisez PRSTO pour la préparation : CV adapté, lettre, ATS scanner, optimisation LinkedIn, brief entretien.",
  },
  {
    q: "Combien de temps pour préparer un candidat ?",
    a: "Moins de 10 minutes. Importez le CV, collez l'offre client, PRSTO génère tout le dossier : CV formaté, lettre, analyse ATS, optimisation LinkedIn et brief entretien. Manuellement, c'est 2 à 3 heures.",
  },
  {
    q: "Qui peut voir les données de mes candidats ?",
    a: "Vous seul. PRSTO fonctionne en local-first : les CV, offres et documents générés restent dans votre espace. Nous ne revendons aucune donnée. Conforme RGPD.",
  },
  {
    q: "Puis-je essayer avant de payer ?",
    a: "Oui, 14 jours d'essai gratuit, sans carte bancaire. Accès à toutes les fonctionnalités de l'offre Pro. Si vous ne voyez pas de valeur, vous résiliez en un clic.",
  },
  {
    q: "Puis-je quitter à tout moment ?",
    a: "Oui, l'abonnement est mensuel et sans engagement. Vous arrêtez quand vous voulez. Le statut Partenaire prend fin automatiquement, et vous disposez de 30 jours pour retirer la marque PRSTO de vos supports.",
  },
  {
    q: "Quelle différence avec un service de rédaction de CV externalisé ?",
    a: "La rapidité et l'échelle. Un rédacteur CV facture 200-500€ et livre en 48-72h. PRSTO prépare un dossier complet en 8 min pour une fraction du prix (99$/mois). Vous pouvez traiter 10 candidats dans le temps d'1 candidat externalisé.",
  },
];

export function RecruitersFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28" style={{ background: "rgba(106,143,109,0.03)" }}>
      <div className="max-w-3xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ FAQ
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Questions fréquentes
          </h2>
        </Reveal>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <Reveal variant="up" delay={i * 50} key={i}>
              <div className="rounded-xl border overflow-hidden" style={{
                borderColor: openIndex === i ? "rgba(16,56,38,0.15)" : "rgba(16,56,38,0.06)",
                background: "#FFFDF8",
              }}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                  style={{ color: "#0B1F18" }}
                >
                  <span className="text-sm font-semibold">{faq.q}</span>
                  <span className="text-lg flex-shrink-0 transition-transform" style={{
                    transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                    color: "#6A8F6D",
                  }}>+</span>
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
