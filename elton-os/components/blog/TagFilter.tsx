"use client";

import { ArticleCategory } from "@/lib/blog/data";

export default function TagFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: {
  categories: { name: ArticleCategory; count: number }[];
  activeCategory: ArticleCategory | null;
  onCategoryChange: (cat: ArticleCategory | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
          activeCategory === null
            ? "bg-[#103826] text-[#FAF6EF] shadow-md"
            : "bg-[#F5F0E8] text-[#50625A] border border-[#E6DED2] hover:border-[#103826] hover:text-[#103826]"
        }`}
      >
        Tous
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() =>
            onCategoryChange(
              activeCategory === cat.name ? null : cat.name
            )
          }
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
            activeCategory === cat.name
              ? "bg-[#103826] text-[#FAF6EF] shadow-md"
              : "bg-[#F5F0E8] text-[#50625A] border border-[#E6DED2] hover:border-[#103826] hover:text-[#103826]"
          }`}
        >
          {cat.name}
          <span className="ml-1.5 opacity-60">({cat.count})</span>
        </button>
      ))}
    </div>
  );
}
