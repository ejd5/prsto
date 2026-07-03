"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "Est-ce que PRSTO Remplace mon ATS ?",
    a: "Non. PRSTO n'est pas un ATS. C'est un moteur de préparation de candidats qui se branche sur vos outils existants (Manatal, Recruit CRM, Excel…). On fait ce qu'aucun ATS ne fait : préparer vos candidats pour le client final.",
  },
  {
    q: "Puis-je utiliser PRSTO avec mon ATS actuel ?",
    a: "Oui, PRSTO est complémentaire. Vous continuez à gérer votre pipeline dans votre ATS, et vous utilisez PRSTO pour la préparation : CV adapté, lettre, ATS scanner, optimisation LinkedIn, brief entretien.",
  },
  {
    q: "Combien de temps pour préparer un candidat ?",
    a: "Moins de 10 minutes. Importez le CV, collez l'offre client, PRSTO génère tout le dossier. Manuellement, c'est 2 à 3 heures par candidat.",
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
    q: "Quelle différence avec un service de rédaction de CV externalisé ?",
    a: "La rapidité et l'échelle. Un rédacteur CV facture 200-500€ et livre en 48-72h. PRSTO prépare un dossier complet en 8 min pour une fraction du prix (99$/mois). Vous pouvez traiter 10 candidats dans le temps d'1 candidat externalisé.",
  },
];

export default function FaqRecruiter() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.03), transparent 65%)", filter: "blur(40px)" }} />
      </div>
      <div className="max-w-3xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6 backdrop-blur-sm" style={{
            borderColor: "rgba(16,56,38,0.1)",
            color: "#103826",
            background: "rgba(16,56,38,0.04)",
          }}>
            ✦ FAQ
          </div>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.04em] leading-[1.08]" style={{ color: "#0B1F18" }}>
            Questions fréquentes
          </h2>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={i} variant="up" delay={i * 60}>
                <div
                  className="rounded-2xl transition-all duration-300 cursor-pointer backdrop-blur-sm overflow-hidden"
                  style={{
                    border: `1px solid ${isOpen ? "rgba(228,177,24,0.15)" : "rgba(16,56,38,0.05)"}`,
                    background: isOpen
                      ? "rgba(255,253,248,0.6)"
                      : "rgba(255,253,248,0.3)",
                    boxShadow: isOpen
                      ? "0 8px 30px rgba(228,177,24,0.06)"
                      : "none",
                  }}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <div className="flex items-center justify-between p-5 md:p-6">
                    <h3 className="text-sm font-bold pr-4" style={{ color: "#0B1F18" }}>{faq.q}</h3>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background: isOpen ? "rgba(228,177,24,0.1)" : "rgba(16,56,38,0.04)",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: isOpen ? "#A38010" : "#6A8F6D" }}>+</span>
                    </div>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? "400px" : "0px",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-5 md:px-6 pb-5 md:pb-6">
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
