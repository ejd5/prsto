import Link from "next/link";
import { COVER_LETTER_EXAMPLES, COVER_LETTER_CATEGORIES } from "@/lib/seo/cover-letters";
import { Mail, Crown, ArrowRight } from "lucide-react";

export const metadata = {
  title: "30 exemples de lettres de motivation pour cadres dirigeants — PRSTO",
  description: "Catalogue de 30 exemples de lettres executive-grade par secteur (banque, tech, pharma) et par situation (transition, premier DG, expatrié). Chaque exemple inclut structure, exemple complet et conseils.",
};

export default function CoverLettersHubPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(236,72,153,0.1)", color: "#EC4899" }}>
            <Mail size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">30 exemples · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Exemples de lettres de motivation
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            30 lettres executive-grade par secteur (banque, tech, pharma, retail) et par situation (transition, premier DG, expatrié, board-ready, founder-style).
          </p>
        </div>

        {COVER_LETTER_CATEGORIES.map((cat) => {
          const examples = COVER_LETTER_EXAMPLES.filter((l) => l.category === cat.id);
          if (examples.length === 0) return null;
          return (
            <div key={cat.id} className="mb-10">
              <div className="mb-4">
                <h2 className="font-serif text-2xl mb-1" style={{ color: "var(--prsto-forest)" }}>
                  {cat.label}
                </h2>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {cat.description} · {examples.length} exemples
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examples.map((ex) => (
                  <Link
                    key={ex.slug}
                    href={`/prsto/lettres/${ex.slug}`}
                    className="block p-5 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                  >
                    <Mail size={18} className="mb-2" style={{ color: "#EC4899" }} />
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--texte)" }}>
                      {ex.title}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: "var(--texte-secondaire)" }}>
                      {ex.summary.slice(0, 120)}...
                    </p>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--prsto-forest)" }}>
                      Voir l'exemple <ArrowRight size={12} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-14 p-8 rounded-2xl text-center" style={{ background: "var(--prsto-forest)" }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: "#FFF" }}>
            Générez votre lettre en 3 tons
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Notre IA génère 3 versions de votre lettre selon la cible : Board, CEO pair, ou Fondateur.
          </p>
          <Link
            href="/prsto/outils/cover-letter"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            style={{ background: "#FFF", color: "var(--prsto-forest)" }}
          >
            Générer mes lettres
          </Link>
        </div>
      </div>
    </div>
  );
}
