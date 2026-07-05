"use client";

import { useState } from "react";
import Reveal from "@/components/landing/Reveal";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "C'est quoi exactement l'Executive Brief ?",
    a: "Un dossier complet de préparation d'entretien pour cadres dirigeants, disponible en téléchargement immédiat au format PDF. Il contient l'analyse de votre CV, les questions STAR, la company intelligence, le plan 30-60-90, le kit négociation, et tout ce dont vous avez besoin pour maximiser vos chances. Chaque section est conçue par des professionnels du recrutement (20+ années d'expérience en cabinet et RH) et produite avec l'appui de l'intelligence artificielle pour garantir précision, profondeur et rapidité.",
  },
  {
    q: "En combien de temps je reçois mon dossier ?",
    a: "Immédiatement. Dès que vous validez le formulaire, votre Executive Brief est généré et téléchargeable automatiquement. Parfait si vous avez un entretien dans les prochains jours.",
  },
  {
    q: "Comment c'est différent de ChatGPT ou d'un site générique ?",
    a: "ChatGPT vous donne des réponses génériques parce qu'il n'a ni votre CV, ni l'annonce, ni le contexte de l'entreprise ciblée. L'Executive Brief est conçu par des professionnels du recrutement qui savent exactement ce que les recruteurs recherchent. Nous analysons votre profil, l'annonce, l'entreprise, et votre LinkedIn avec une grille d'évaluation professionnelle — la même que celle utilisée par les cabinets de chasse de têtes. L'IA n'est qu'un accélérateur : l'expertise et la méthode viennent de nos équipes.",
  },
  {
    q: "Est-ce que je peux être remboursé ?",
    a: "Si l'Executive Brief ne répond pas à vos attentes, contactez-nous dans les 7 jours suivant la commande et nous vous remboursons intégralement. Sans question.",
  },
  {
    q: "J'ai déjà la Semaine à 9,90€. Pourquoi payer plus ?",
    a: "La Semaine vous donne accès à toutes les fonctionnalités de la plateforme (ATS Scanner, CV Optimizer, Pipeline, etc.). L'Executive Brief est un produit complémentaire : c'est le dossier livré clé en main, avec des sections exclusives (company intelligence, plan 30-60-90, kit négociation, profilage intervieweur) qui ne sont pas disponibles dans la plateforme standard. La Semaine = l'atelier. L'Executive Brief = le dossier terminé.",
  },
  {
    q: "Est-ce que ça remplace un coach humain ?",
    a: "Non. Et c'est assumé. Un coach humain vous apporte un regard extérieur, un suivi dans la durée, et une flexibilité que même la meilleure IA ne peut reproduire. L'Executive Brief est conçu pour les situations où vous avez besoin d'un résultat immédiat : vous avez un entretien dans 48h, vous voulez un dossier complet sans attendre, et vous ne voulez pas payer 500€ pour une séance de préparation. Si vous avez le temps et le budget, prenez un coach. Si votre entretien est dans 3 jours et que vous voulez 15-20 pages de préparation pour 29,90€, prenez l'Executive Brief.",
  },
  {
    q: "Comment vous garantissez la qualité du dossier ?",
    a: "Chaque Executive Brief est structuré selon les méthodes éprouvées des cabinets de recrutement internationaux (Korn Ferry, Egon Zehnder, Spencer Stuart). Nos équipes — qui cumulent plus de 20 années d'expérience en recrutement et RH — ont défini les grilles d'analyse, les frameworks de réponse et les critères de qualité. L'intelligence artificielle est utilisée comme un outil pour produire le contenu à partir de ces méthodes. Une vérification automatique de complétude et de cohérence est effectuée avant livraison. Et si le dossier ne vous satisfait pas, vous êtes remboursé.",
  },
  {
    q: "Je peux commander pour quelqu'un d'autre ?",
    a: "Oui. Si vous êtes RH ou chasseur de têtes et que vous voulez préparer un candidat, commandez avec les informations du candidat. Le dossier sera généré directement.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left gap-4"
        style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0, font: "inherit" }}
      >
        <span className="text-[15px] font-medium leading-snug pr-4" style={{ color: open ? "#fff" : "rgba(255,255,255,0.7)" }}>
          {q}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: "rgba(255,255,255,0.3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <p className="mt-3 text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.45)" }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function ExecutiveBriefFaq() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              Questions fréquentes
            </h2>
          </div>
        </Reveal>

        <Reveal variant="fade">
          <div>
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
