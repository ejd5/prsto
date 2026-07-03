"use client";

import { ContentBlock } from "@/lib/blog/data";

function DropCap({ text }: { text: string }) {
  const firstChar = text.charAt(0);
  const rest = text.slice(1);
  return (
    <p className="text-base md:text-lg leading-[1.8] text-[#0B1F18] mb-6">
      <span className="float-left text-5xl md:text-6xl font-bold leading-[0.85] mr-3 mt-1 text-[#103826]" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}>
        {firstChar}
      </span>
      {rest}
    </p>
  );
}

export default function ArticleContent({
  content,
}: {
  content: ContentBlock[];
}) {
  let firstParagraph = true;

  return (
    <div className="space-y-6">
      {content.map((block, i) => {
        switch (block.type) {
          case "intro":
            return (
              <p
                key={i}
                className="text-base md:text-lg leading-[1.8] text-[#50625A] font-display italic border-l-4 border-[#E4B118] pl-5 md:pl-6 mb-8"
              >
                {block.text}
              </p>
            );

          case "h2":
            return (
              <h2
                key={i}
                className="text-2xl md:text-3xl font-bold text-[#103826] mt-12 mb-4 leading-tight font-display"
              >
                {block.text}
              </h2>
            );

          case "h3":
            return (
              <h3
                key={i}
                className="text-lg md:text-xl font-bold text-[#0E3A29] mt-8 mb-3 leading-snug font-display"
              >
                {block.text}
              </h3>
            );

          case "p": {
            const isFirst = firstParagraph;
            if (firstParagraph) firstParagraph = false;
            return isFirst ? (
              <DropCap key={i} text={block.text!} />
            ) : (
              <p
                key={i}
                className="text-base md:text-lg leading-[1.8] text-[#0B1F18] mb-6"
              >
                {block.text}
              </p>
            );
          }

          case "pullQuote":
            return (
              <blockquote
                key={i}
                className="relative my-8 md:my-10 pl-6 md:pl-8 py-4 border-l-[3px] border-[#E4B118] bg-[#F5F0E8] rounded-r-xl"
              >
                <svg
                  className="absolute top-3 left-[-12px] w-6 h-6 text-[#E4B118] opacity-40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                </svg>
                <p className="text-base md:text-lg leading-[1.7] text-[#0B1F18] font-display italic">
                  {block.text}
                </p>
                {block.author && (
                  <footer className="mt-3 text-sm font-semibold text-[#50625A]">
                    — {block.author}
                  </footer>
                )}
              </blockquote>
            );

          case "stat":
            return (
              <div
                key={i}
                className="my-8 md:my-10 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#103826] to-[#0E3A29] text-center"
              >
                <div className="text-4xl md:text-6xl font-bold text-[#E4B118] mb-2 font-display">
                  {block.stat!.value}
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-white/90 mb-3">
                  {block.stat!.label}
                </div>
                <p className="text-sm leading-relaxed text-white/70 max-w-lg mx-auto">
                  {block.stat!.description}
                </p>
              </div>
            );

          case "ul":
            return (
              <ul key={i} className="space-y-3 my-6">
                {block.items?.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-base md:text-lg leading-[1.7] text-[#0B1F18]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E4B118] mt-3 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
