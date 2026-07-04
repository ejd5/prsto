import Link from "next/link";
import { notFound } from "next/navigation";
import { CV_EXAMPLES, getCVExampleBySlug, getAllCVExampleSlugs } from "@/lib/seo/cv-examples";
import { articleJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo/helpers";
import { Crown, Check, FileText, ArrowRight, Sparkles } from "lucide-react";

export async function generateStaticParams() {
  return getAllCVExampleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getCVExampleBySlug(slug);
  if (!example) return { title: "CV example non trouvé" };
  return {
    title: `${example.title} — exemple et modèle gratuit | PRSTO`,
    description: example.summary.slice(0, 160),
  };
}

export default async function CVExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getCVExampleBySlug(slug);
  if (!example) notFound();

  const baseUrl = "https://prsto.ai";
  const pageUrl = `${baseUrl}/prsto/cv-examples/${example.slug}`;

  const articleLd = articleJsonLd({
    title: example.title,
    description: example.summary.slice(0, 160),
    url: pageUrl,
    keywords: example.keywords,
  });
  const faqLd = faqJsonLd(example.faq);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "PRSTO", url: baseUrl },
    { name: "Exemples CV", url: `${baseUrl}/prsto/cv-examples` },
    { name: example.title, url: pageUrl },
  ]);

  // Related examples (same category, different slug)
  const related = CV_EXAMPLES.filter((cv) => cv.category === example.category && cv.slug !== example.slug).slice(0, 3);

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs mb-6 flex items-center gap-2" style={{ color: "var(--texte-tertiaire)" }}>
          <Link href="/" className="hover:underline">PRSTO</Link>
          <span>›</span>
          <Link href="/prsto/cv-examples" className="hover:underline">Exemples CV</Link>
          <span>›</span>
          <span style={{ color: "var(--texte)" }}>{example.title}</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Crown size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">{example.category} · {example.salaryRange}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl mb-4" style={{ color: "var(--prsto-forest)" }}>
            {example.title}
          </h1>
          <p className="text-base" style={{ color: "var(--texte-secondaire)" }}>
            {example.summary}
          </p>
        </div>

        {/* Key skills */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            <Sparkles size={12} className="inline mr-1" style={{ color: "#F59E0B" }} />
            Compétences clés attendues
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {example.keySkills.map((skill) => (
              <div key={skill} className="text-xs flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                <Check size={12} style={{ color: "#10B981" }} />
                <span style={{ color: "var(--texte)" }}>{skill}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements examples */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            <FileText size={12} className="inline mr-1" style={{ color: "var(--prsto-forest)" }} />
            Exemples de réalisations chiffrées
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--texte-tertiaire)" }}>
            Inspirerez-vous de ces formulations pour votre CV. Chaque réalisation doit être chiffrée (M€, %, personnes, pays).
          </p>
          <div className="space-y-3">
            {example.achievements.map((ach, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                <span className="text-xs font-mono font-bold mt-0.5" style={{ color: "var(--prsto-forest)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm" style={{ color: "var(--texte)" }}>{ach}</p>
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
            Construisez votre CV {example.title.replace("CV ", "").toLowerCase()}
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Analysez votre CV avec 35 critères ATS, ou laissez notre AI Resume Agent le construire avec vous en conversation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/prsto/ats-checker"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#FFF", color: "var(--prsto-forest)" }}
            >
              Analyser mon CV (gratuit)
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
                  href={`/prsto/cv-examples/${rel.slug}`}
                  className="block p-4 rounded-xl transition-all hover:shadow-md"
                  style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
                >
                  <FileText size={16} className="mb-2" style={{ color: "var(--prsto-forest)" }} />
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
