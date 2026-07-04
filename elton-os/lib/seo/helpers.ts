/**
 * PRSTO SEO Library
 * ================
 * Helpers for SEO-optimized pages: slugs, structured data, breadcrumbs.
 */

// ─── Slug helpers ───────────────────────────────────────────
export function slugifyFr(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Breadcrumbs ────────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── Article structured data (for SEO) ─────────────────────
export function articleJsonLd(params: {
  title: string;
  description: string;
  url: string;
  publishedTime?: string;
  author?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url: params.url,
    datePublished: params.publishedTime || "2026-01-01",
    author: {
      "@type": "Organization",
      name: params.author || "PRSTO",
    },
    publisher: {
      "@type": "Organization",
      name: "PRSTO",
      logo: {
        "@type": "ImageObject",
        url: "https://prsto.ai/branding/logo-prsto.png",
      },
    },
    keywords: (params.keywords || []).join(", "),
  };
}

// ─── FAQ structured data (rich snippets) ───────────────────
export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
