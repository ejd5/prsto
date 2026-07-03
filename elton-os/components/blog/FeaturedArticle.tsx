"use client";

import Link from "next/link";
import { BlogArticle, getCategoryGradient } from "@/lib/blog/data";
import { Clock, ArrowRight, Sparkle } from "@phosphor-icons/react";

export default function FeaturedArticle({
  article,
}: {
  article: BlogArticle;
}) {
  const gradient = getCategoryGradient(article.category);
  const imagePath = `/blog/${article.slug}.png`;

  return (
    <Link
      href={`/prsto/blog/${article.slug}`}
      className="group block rounded-3xl overflow-hidden border border-[#E6DED2] bg-[#FFFDF8] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(16,56,38,0.10),0_0_0_1px_rgba(228,177,24,0.2)]"
    >
      <div className="grid md:grid-cols-5 min-h-[320px]">
        <div
          className={`md:col-span-2 bg-gradient-to-br ${gradient} relative overflow-hidden p-8 flex flex-col justify-between min-h-[200px] md:min-h-full`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Sparkle size={14} weight="fill" className="text-[#E4B118]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                Article à la une
              </span>
            </div>
            <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur-sm border border-white/20">
              {article.category}
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] text-white/70 font-medium">
              {article.date}
            </p>
            <p className="text-[11px] text-white/70 flex items-center gap-1 mt-1">
              <Clock size={11} weight="bold" />
              {article.readingTime}
            </p>
          </div>
        </div>

        <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight text-[#0B1F18] mb-4 transition-colors duration-300 group-hover:text-[#E4B118] font-display">
              {article.title}
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-[#50625A]">
              {article.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E6DED2]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#103826] flex items-center justify-center text-xs font-bold text-[#FAF6EF]">
                {article.author.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0B1F18]">
                  {article.author.name}
                </p>
                <p className="text-xs text-[#50625A]">{article.author.role}</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-[#E4B118] transition-all duration-300 group-hover:gap-3">
              Lire l'article
              <ArrowRight size={18} weight="bold" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
