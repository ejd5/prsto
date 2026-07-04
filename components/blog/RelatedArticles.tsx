"use client";

import Link from "next/link";
import { BlogArticle, getCategoryGradient } from "@/lib/blog/data";
import { Clock, ArrowRight } from "@phosphor-icons/react";

export default function RelatedArticles({
  articles,
}: {
  articles: BlogArticle[];
}) {
  if (articles.length === 0) return null;

  return (
    <div className="border-t border-[#E6DED2] pt-10 mt-10">
      <h3 className="text-lg font-bold text-[#103826] mb-6 font-display">
        Articles recommandés
      </h3>
      <div className="grid md:grid-cols-3 gap-5">
        {articles.slice(0, 3).map((article) => (
          <Link
            key={article.slug}
            href={`/prsto/blog/${article.slug}`}
            className="group block rounded-xl overflow-hidden border border-[#E6DED2] bg-[#FFFDF8] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(16,56,38,0.08)] hover:-translate-y-0.5"
          >
            <div
              className={`h-28 bg-gradient-to-br ${getCategoryGradient(article.category)} relative`}
            >
              <div className="absolute bottom-2 left-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                  {article.category}
                </span>
              </div>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-2 text-[10px] text-[#50625A] mb-1.5">
                <time dateTime={article.date}>{article.date}</time>
                <span className="w-0.5 h-0.5 rounded-full bg-[#E6DED2]" />
                <span className="flex items-center gap-0.5">
                  <Clock size={10} weight="bold" />
                  {article.readingTime}
                </span>
              </div>
              <h4 className="text-sm font-bold leading-snug text-[#0B1F18] transition-colors duration-300 group-hover:text-[#E4B118] line-clamp-2 font-display">
                {article.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/prsto/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#E4B118] hover:gap-3 transition-all duration-300"
        >
          Voir tous les articles
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
