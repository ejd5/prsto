import Link from "next/link";
import { CV_EXAMPLES, CV_CATEGORIES } from "@/lib/seo/cv-examples";
import { FileText, Crown, ArrowRight } from "lucide-react";

export const metadata = {
  title: "50 exemples de CV pour cadres dirigeants — PRSTO",
  description: "Catalogue de 50 exemples de CV executive-grade : DG, CFO, COO, Country Manager, VP, MD, Partner PE, et plus. Chaque exemple inclut compétences clés, réalisations chiffrées et FAQ.",
};

export default function CVExamplesHubPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Crown size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">50 exemples · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Exemples de CV cadres dirigeants
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            50 exemples de CV pour postes exécutifs : C-Suite, directions fonctionnelles, conseil/finance, international. Chaque exemple inclut compétences clés, réalisations chiffrées et FAQ.
          </p>
        </div>

        {/* Categories */}
        {CV_CATEGORIES.map((cat) => {
          const examples = getCVExamplesByCategory(cat.id);
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
                    href={`/prsto/cv-examples/${ex.slug}`}
                    className="block p-5 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FileText size={18} style={{ color: "var(--prsto-forest)" }} />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "#F9FAFB", color: "var(--texte-tertiaire)" }}>
                        {ex.salaryRange}
                      </span>
                    </div>
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

        {/* CTA */}
        <div className="mt-14 p-8 rounded-2xl text-center" style={{ background: "var(--prsto-forest)" }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: "#FFF" }}>
            Votre CV executive vous attend
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Analysez votre CV avec notre ATS Checker 35 points, ou laissez notre AI Resume Agent le construire avec vous.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/prsto/ats-checker"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#FFF", color: "var(--prsto-forest)" }}
            >
              ATS Checker (gratuit)
            </Link>
            <Link
              href="/prsto/outils/agent-cv"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "transparent", color: "#FFF", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              AI Resume Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCVExamplesByCategory(category: string) {
  return CV_EXAMPLES.filter((cv) => cv.category === category);
}
