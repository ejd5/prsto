import Link from "next/link";
import { SYNONYM_EXAMPLES, SYNONYM_CATEGORIES } from "@/lib/seo/synonyms";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Synonymes management pour cadres — 50 verbes executive | PRSTO",
  description: "50 synonymes de verbes management executive : diriger, piloter, transformer, fédérer, optimiser. Chaque verbe avec nuances, exemples CV et conseils.",
};

export default function SynonymsHubPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
            <BookOpen size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">50 synonymes · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Synonymes management pour cadres
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            50 verbes executive avec nuances, exemples CV et conseils. Enrichissez votre vocabulaire professionnel pour CV, lettres et entretiens.
          </p>
        </div>

        {SYNONYM_CATEGORIES.map((cat) => {
          const examples = SYNONYM_EXAMPLES.filter((s) => s.category === cat.id);
          if (examples.length === 0) return null;
          return (
            <div key={cat.id} className="mb-10">
              <div className="mb-4">
                <h2 className="font-serif text-2xl mb-1" style={{ color: "var(--prsto-forest)" }}>
                  {cat.label}
                </h2>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {cat.description} · {examples.length} synonymes
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examples.map((ex) => (
                  <Link
                    key={ex.slug}
                    href={`/prsto/synonymes/${ex.slug}`}
                    className="block p-5 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                  >
                    <h3 className="text-base font-serif italic mb-2" style={{ color: "var(--prsto-forest)" }}>
                      {ex.word}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: "var(--texte-secondaire)" }}>
                      {ex.context.slice(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "#F9FAFB", color: "var(--texte-tertiaire)" }}>
                        {ex.synonyms.length} synonymes
                      </span>
                      <div className="flex items-center gap-1 text-xs" style={{ color: "var(--prsto-forest)" }}>
                        Voir <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-14 p-8 rounded-2xl text-center" style={{ background: "var(--prsto-forest)" }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: "#FFF" }}>
            Enrichissez votre CV executive
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Notre AI Bullet Point Writer génère des bullets executive-grade avec les verbes les plus impactants pour votre CV.
          </p>
          <Link
            href="/prsto/outils"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            style={{ background: "#FFF", color: "var(--prsto-forest)" }}
          >
            Découvrir les outils PRSTO
          </Link>
        </div>
      </div>
    </div>
  );
}
