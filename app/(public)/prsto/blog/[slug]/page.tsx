import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
  articles,
  getArticleBySlug,
  getRelatedArticles,
  getCategoryGradient,
} from "@/lib/blog/data";
import ArticleContent from "@/components/blog/ArticleContent";
import AuthorCard from "@/components/blog/AuthorCard";
import ShareButtons from "@/components/blog/ShareButtons";
import RelatedArticles from "@/components/blog/RelatedArticles";

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} — Le Journal PRSTO`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} — PRSTO`,
      description: article.excerpt,
      type: "article",
      publishedTime: article.date,
      authors: [article.author.name],
      locale: "fr_FR",
      siteName: "PRSTO — Le copilote carrière IA",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
    },
  };
}

function ArrowLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);
  const gradient = getCategoryGradient(article.category);
  const baseUrl = "https://prsto.fr";
  const articleUrl = `${baseUrl}/prsto/blog/${article.slug}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/prsto/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#50625A] hover:text-[#103826] transition-colors uppercase tracking-wider"
        >
          <ArrowLeftIcon />
          Retour au journal
        </Link>
      </nav>

      <article>
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-[#50625A] mb-4">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5F0E8] text-[#103826] border border-[#E6DED2]">
              {article.category}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon />
              {article.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#E6DED2]" />
            <span className="flex items-center gap-1">
              <ClockIcon />
              {article.readingTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#103826] leading-tight mb-4 font-display">
            {article.title}
          </h1>

          <p className="text-base md:text-lg text-[#50625A] leading-relaxed max-w-3xl">
            {article.subtitle}
          </p>

          {/* Author mini + share */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-[#E6DED2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#103826] flex items-center justify-center text-xs font-bold text-[#FAF6EF]">
                {article.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0B1F18]">
                  {article.author.name}
                </p>
                <p className="text-xs text-[#50625A]">
                  {article.author.role}
                </p>
              </div>
            </div>
            <ShareButtons url={articleUrl} title={article.title} />
          </div>
        </header>

        {/* Hero image */}
        <div className="w-full h-56 md:h-72 lg:h-80 rounded-2xl relative overflow-hidden mb-10 md:mb-12 bg-[#103826]">
          {article.image ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${article.image})` }}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-70" />
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10">
            <div className="text-4xl md:text-5xl font-bold text-white/20 font-playfair">
              {article.category === "Marché & Tendances"
                ? "MT"
                : article.category === "CV & Personal Branding"
                  ? "CV"
                  : article.category === "Négociation & Package"
                    ? "NP"
                    : article.category === "Réseau & Chasseurs"
                      ? "RC"
                      : article.category === "Entretien"
                        ? "EN"
                        : article.category === "Stratégie"
                          ? "ST"
                          : "TR"}
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="max-w-3xl mx-auto">
          <ArticleContent content={article.content} />
        </div>

        {/* Tags */}
        <div className="max-w-3xl mx-auto mt-10 pt-6 border-t border-[#E6DED2]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#50625A] mr-1">
              Tags
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#F5F0E8] text-[#50625A] border border-[#E6DED2]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author card full */}
        <div className="max-w-3xl mx-auto mt-8">
          <AuthorCard author={article.author} />
        </div>

        {/* Related articles */}
        <RelatedArticles articles={related} />
      </article>
    </div>
  );
}
