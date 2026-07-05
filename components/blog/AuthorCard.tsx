import { Author } from "@/lib/blog/data";

export default function AuthorCard({ author }: { author: Author }) {
  return (
    <div className="flex items-start gap-4 md:gap-5 p-4 md:p-5 rounded-xl bg-[#F5F0E8] border border-[#E6DED2]">
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#103826] flex items-center justify-center text-sm md:text-base font-bold text-[#FAF6EF] shrink-0">
        {author.name.split(" ").map((n) => n[0]).join("")}
      </div>
      <div className="min-w-0">
        <p className="text-sm md:text-base font-bold text-[#0B1F18]">{author.name}</p>
        <p className="text-xs text-[#50625A] mb-1.5">{author.role}</p>
        <p className="text-xs md:text-sm leading-relaxed text-[#50625A]">
          {author.bio}
        </p>
      </div>
    </div>
  );
}
