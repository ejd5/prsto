import Link from "next/link";
import { notFound } from "next/navigation";
import { SYNONYM_EXAMPLES, getSynonymBySlug, getAllSynonymSlugs } from "@/lib/seo/synonyms";
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/helpers";
import { BookOpen, ArrowRight, Lightbulb } from "lucide-react";

export async function generateStaticParams() {
  return getAllSynonymSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getSynonymBySlug(slug);
  if (!example) return { title: "Synonyme non trouvé" };
  return {
    title: `Synonyme de ${example.word} — nuances et exemples CV | PRSTO`,
    description: `Découvrez ${example.synonyms.length} synonymes de "${example.word}" avec nuances, exemples CV executive et conseils.`,
  };
}

const POWER_LEVEL_META: Record<string, { label: string; color: string }> = {
  fort: { label: "Fort", color: "#EF4444" },
  neutre: { label: "Neutre", color: "#3B82F6" },
  doux: { label: "Doux", color: "#9CA3AF" },
};

export default async function SynonymPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getSynonymBySlug(slug);
  if (!example) notFound();

  const baseUrl = "https://prsto.ai";
  const pageUrl = `${baseUrl}/prsto/synonymes/${example.slug}`;

  const articleLd = articleJsonLd({
    title: `Synonyme de ${example.word}`,
    description: `Synonymes de "${example.word}" avec nuances et exemples pour CV executive.`,
    url: pageUrl,
    keywords: [`synonyme ${example.word}`, example.word, "synonyme management", "synonyme cadre"],
  });
  const faqLd = faqJsonLd(example.faq);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "PRSTO", url: baseUrl },
    { name: "Synonymes", url: `${baseUrl}/prsto/synonymes` },
    { name: `Synonyme de ${example.word}`, url: pageUrl },
  ]);

  const related = SYNONYM_EXAMPLES.filter((s) => s.category === example.category && s.slug !== example.slug).slice(0, 4);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto">
        <nav className="text-xs mb-6 flex items-center gap-2" style={{ color: "var(--texte-tertiaire)" }}>
          <Link href="/" className="hover:underline">PRSTO</Link>
          <span>›</span>
          <Link href="/prsto/synonymes" className="hover:underline">Synonymes</Link>
          <span>›</span>
          <span style={{ color: "var(--texte)" }}>Synonyme de {example.word}</span>
        </nav>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
            <BookOpen size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">{example.category} · {example.synonyms.length} synonymes</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4" style={{ color: "var(--prsto-forest)" }}>
            Synonyme de <em>{example.word}</em>
          </h1>
          <p className="text-base" style={{ color: "var(--texte-secondaire)" }}>
            {example.context}
          </p>
        </div>

        {/* Synonyms list */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            {example.synonyms.length} synonymes avec nuances
          </h2>
          <div className="space-y-3">
            {example.synonyms.map((syn, i) => {
              const power = POWER_LEVEL_META[syn.powerLevel];
              return (
                <div key={i} className="p-4 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-serif italic" style={{ color: "var(--prsto-forest)" }}>
                      {syn.word}
                    </h3>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded uppercase"
                      style={{ background: `${power.color}15`, color: power.color }}
                    >
                      {power.label}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--texte-secondaire)" }}>
                    <strong>Nuance :</strong> {syn.nuance}
                  </p>
                  <p className="text-sm italic" style={{ color: "var(--texte)" }}>
                    "{syn.example}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CV use case */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: "#92400E" }}>
            <Lightbulb size={14} /> Comment l'utiliser dans un CV executive
          </h2>
          <p className="text-sm" style={{ color: "var(--texte)" }}>
            {example.cvUseCase}
          </p>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {example.faq.map((f, i) => (
              <details key={i} className="group">
                <summary className="text-sm font-medium cursor-pointer flex items-center gap-2" style={{ color: "var(--texte)" }}>
                  <span className="text-xs font-mono" style={{ color: "var(--prsto-forest)" }}>Q{i + 1}.</span>
                  {f.question}
                </summary>
                <p className="text-xs mt-2 ml-6" style={{ color: "var(--texte-secondaire)" }}>
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center mb-10" style={{ background: "var(--prsto-forest)" }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: "#FFF" }}>
            Enrichissez votre CV avec les bons verbes
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Notre AI Bullet Point Writer choisit automatiquement les verbes les plus impactants pour vos réalisations executive.
          </p>
          <Link
            href="/prsto/outils"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            style={{ background: "#FFF", color: "var(--prsto-forest)" }}
          >
            Découvrir les outils
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
              Autres synonymes en {example.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/prsto/synonymes/${rel.slug}`}
                  className="block p-4 rounded-xl transition-all hover:shadow-md"
                  style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                >
                  <h3 className="text-sm font-serif italic mb-1" style={{ color: "var(--prsto-forest)" }}>
                    {rel.word}
                  </h3>
                  <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                    {rel.synonyms.length} synonymes
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
