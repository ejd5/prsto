import Link from "next/link";
import { notFound } from "next/navigation";
import { COVER_LETTER_EXAMPLES, getCoverLetterBySlug, getAllCoverLetterSlugs } from "@/lib/seo/cover-letters";
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/helpers";
import { Mail, ArrowRight, Check, Lightbulb } from "lucide-react";

export async function generateStaticParams() {
  return getAllCoverLetterSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getCoverLetterBySlug(slug);
  if (!example) return { title: "Lettre non trouvée" };
  return {
    title: `${example.title} — exemple et modèle | PRSTO`,
    description: example.summary.slice(0, 160),
  };
}

export default async function CoverLetterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getCoverLetterBySlug(slug);
  if (!example) notFound();

  const baseUrl = "https://prsto.ai";
  const pageUrl = `${baseUrl}/prsto/lettres/${example.slug}`;

  const articleLd = articleJsonLd({
    title: example.title,
    description: example.summary.slice(0, 160),
    url: pageUrl,
    keywords: [example.targetRole, example.sector, "lettre de motivation", "cadre dirigeant"].filter(Boolean) as string[],
  });
  const faqLd = faqJsonLd(example.faq);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "PRSTO", url: baseUrl },
    { name: "Lettres", url: `${baseUrl}/prsto/lettres` },
    { name: example.title, url: pageUrl },
  ]);

  const related = COVER_LETTER_EXAMPLES.filter((l) => l.category === example.category && l.slug !== example.slug).slice(0, 3);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto">
        <nav className="text-xs mb-6 flex items-center gap-2" style={{ color: "var(--texte-tertiaire)" }}>
          <Link href="/" className="hover:underline">PRSTO</Link>
          <span>›</span>
          <Link href="/prsto/lettres" className="hover:underline">Lettres</Link>
          <span>›</span>
          <span style={{ color: "var(--texte)" }}>{example.title}</span>
        </nav>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(236,72,153,0.1)", color: "#EC4899" }}>
            <Mail size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">{example.category} · {example.targetRole}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl mb-4" style={{ color: "var(--prsto-forest)" }}>
            {example.title}
          </h1>
          <p className="text-base" style={{ color: "var(--texte-secondaire)" }}>
            {example.summary}
          </p>
        </div>

        {/* Structure */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            Structure recommandée
          </h2>
          <div className="space-y-2">
            {example.structure.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                <span className="text-xs font-mono font-bold mt-0.5" style={{ color: "var(--prsto-forest)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--texte)" }}>{s.part}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{s.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full example */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            Exemple complet
          </h2>
          <pre className="text-sm whitespace-pre-wrap font-sans p-4 rounded-lg" style={{ background: "#F9FAFB", color: "var(--texte)" }}>
            {example.fullExample}
          </pre>
        </div>

        {/* Tips */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4 flex items-center gap-2" style={{ color: "#92400E" }}>
            <Lightbulb size={14} /> Conseils
          </h2>
          <div className="space-y-2">
            {example.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--texte)" }}>
                <Check size={12} style={{ color: "#F59E0B", marginTop: 4 }} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
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
            Générez votre lettre personnalisée
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Notre IA génère 3 versions (board, peer, founder) en quelques secondes, adaptées à votre profil et à l'offre.
          </p>
          <Link
            href="/prsto/outils/cover-letter"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            style={{ background: "#FFF", color: "var(--prsto-forest)" }}
          >
            Générer mes lettres
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
              Autres exemples en {example.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/prsto/lettres/${rel.slug}`}
                  className="block p-4 rounded-xl transition-all hover:shadow-md"
                  style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                >
                  <Mail size={16} className="mb-2" style={{ color: "#EC4899" }} />
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--texte)" }}>
                    {rel.title}
                  </h3>
                  <p className="text-xs mb-2" style={{ color: "var(--texte-secondaire)" }}>
                    {rel.summary.slice(0, 80)}...
                  </p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--prsto-forest)" }}>
                    Voir <ArrowRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
