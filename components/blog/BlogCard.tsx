"use client";

import Link from "next/link";
import { ArticleCategory, BlogArticle } from "@/lib/blog/data";
import { Clock, ArrowRight } from "@phosphor-icons/react";

const categoryGradients: Record<ArticleCategory, string> = {
  "Marché & Tendances": "from-[#103826] to-[#1A4A2E]",
  "CV & Personal Branding": "from-[#0E3A29] to-[#1F4A34]",
  "Négociation & Package": "from-[#E4B118] to-[#D4A017]",
  "Réseau & Chasseurs": "from-[#1F4A34] to-[#2A5A40]",
  "Entretien": "from-[#2A5A40] to-[#3A6A50]",
  "Stratégie": "from-[#103826] to-[#0E3A29]",
  "Transition": "from-[#1A4A2E] to-[#0E3A29]",
};

export default function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <Link
      href={`/prsto/blog/${article.slug}`}
      className="group block rounded-2xl overflow-hidden border border-[#E6DED2] bg-[#FFFDF8] transition-all duration-500 hover:shadow-[0_8px_30px_rgba(16,56,38,0.08),0_0_0_1px_rgba(228,177,24,0.15)] hover:-translate-y-0.5"
    >
      <div className="h-48 relative overflow-hidden bg-[#103826]">
        {article.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${article.image})` }}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[article.category]}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-65" />
        <div className="absolute bottom-4 left-4 z-10">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#103826]/75 text-[#FAF6EF] backdrop-blur-sm border border-[#E6DED2]/30">
            {article.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 text-[11px] font-medium text-[#50625A] mb-3">
          <time dateTime={article.date}>{article.date}</time>
          <span className="w-1 h-1 rounded-full bg-[#E6DED2]" />
          <span className="flex items-center gap-1">
            <Clock size={12} weight="bold" />
            {article.readingTime}
          </span>
        </div>

        <h3 className="text-lg font-bold leading-snug text-[#0B1F18] mb-2 transition-colors duration-300 group-hover:text-[#E4B118] font-display">
          {article.title}
        </h3>

        <p className="text-sm leading-relaxed text-[#50625A] line-clamp-3">
          {article.excerpt}
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E6DED2]">
          <div className="w-7 h-7 rounded-full bg-[#103826] flex items-center justify-center text-[10px] font-bold text-[#FAF6EF] shrink-0">
            {article.author.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0B1F18] truncate">
              {article.author.name}
            </p>
            <p className="text-[10px] text-[#50625A] truncate">
              {article.author.role}
            </p>
          </div>
          <ArrowRight
            size={16}
            weight="bold"
            className="text-[#E4B118] transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}
