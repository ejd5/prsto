"use client";

import { useState, useMemo } from "react";
import {
  articles,
  categories,
  paginateArticles,
  getArticlesByCategory,
  BlogArticle,
  ArticleCategory,
} from "@/lib/blog/data";
import FeaturedArticle from "@/components/blog/FeaturedArticle";
import BlogCard from "@/components/blog/BlogCard";
import TagFilter from "@/components/blog/TagFilter";
import { Article, Newspaper, MagnifyingGlass } from "@phosphor-icons/react";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] =
    useState<ArticleCategory | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCategory) return getArticlesByCategory(activeCategory);
    return articles;
  }, [activeCategory]);

  const featured = useMemo(
    () => filtered.find((a) => a.featured) || filtered[0],
    [filtered]
  );

  const rest = useMemo(
    () => filtered.filter((a) => a.slug !== featured?.slug),
    [filtered, featured]
  );

  const perPage = 6;
  const totalPages = Math.max(1, Math.ceil(rest.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = rest.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handleCategoryChange = (cat: ArticleCategory | null) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      {/* Header section */}
      <div className="text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#103826] text-[#FAF6EF] text-[10px] font-bold uppercase tracking-widest mb-4">
          <Newspaper size={12} weight="fill" />
          Le Journal PRSTO
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#103826] leading-tight mb-4 font-display">
          Analyses, enquêtes{" "}
          <span className="text-[#E4B118]">&</span> tendances
        </h1>
        <p className="text-base md:text-lg text-[#50625A] max-w-2xl mx-auto leading-relaxed">
          Le carnet éditorial de PRSTO. Enquêtes, interviews, études et
          conseils pour cadres dirigeants en recherche d&apos;emploi ou en
          réflexion de carrière.
        </p>
      </div>

      {/* Tag filter */}
      <div className="mb-8 md:mb-10 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-[#50625A]">
          <MagnifyingGlass size={12} weight="bold" />
          Filtrer :
        </div>
        <TagFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Featured article */}
      {featured && currentPage === 1 && (
        <div className="mb-10 md:mb-14">
          <FeaturedArticle article={featured} />
        </div>
      )}

      {/* Article grid */}
      {paginated.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {paginated.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5F0E8] mb-4">
            <Article size={28} className="text-[#50625A]" />
          </div>
          <p className="text-lg font-semibold text-[#0B1F18] mb-1">
            Aucun article dans cette catégorie
          </p>
          <p className="text-sm text-[#50625A]">
            Explorez d&apos;autres catégories ou revenez bientôt.
          </p>
        </div>
      )}

      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E6DED2] text-[#50625A] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#103826] hover:text-[#103826] transition-colors"
          >
            ← Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-xs font-bold rounded-lg transition-all duration-200 ${
                p === currentPage
                  ? "bg-[#103826] text-[#FAF6EF] shadow-md"
                  : "border border-[#E6DED2] text-[#50625A] hover:border-[#103826] hover:text-[#103826]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E6DED2] text-[#50625A] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#103826] hover:text-[#103826] transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Newsletter teaser */}
      <div className="mt-16 md:mt-20 p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#103826] to-[#0E3A29] text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
          Restez informé
        </h2>
        <p className="text-sm md:text-base text-white/70 max-w-lg mx-auto mb-6">
          Recevez les nouveaux articles, les analyses de marché et les conseils
          PRSTO directement dans votre boîte mail.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="votre@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-[#E4B118] transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#E4B118] text-[#0B1F18] text-sm font-bold hover:bg-[#F2C94C] transition-colors"
          >
            S&apos;inscrire
          </button>
        </form>
        <p className="text-[10px] text-white/40 mt-3">
          Pas de spam. Désinscription en un clic.
        </p>
      </div>
    </div>
  );
}
