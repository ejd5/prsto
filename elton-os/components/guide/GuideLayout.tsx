"use client";

import { type ReactNode } from "react";

type CheckItem = {
  label: string;
  detail?: string;
};

type ChecklistProps = {
  title?: string;
  items: (string | CheckItem)[];
};

export default function Checklist({ title = "À faire", items }: ChecklistProps) {
  return (
    <div
      className="my-6 rounded-xl border p-5"
      style={{
        borderColor: "rgba(16,56,38,0.10)",
        background: "#FFFDF8",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">☑</span>
        <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#103826" }}>
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const it = typeof item === "string" ? { label: item } : item;
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center"
                style={{
                  borderColor: "rgba(16,56,38,0.25)",
                  background: "#FAF6EF",
                }}
              >
                <span className="text-[10px]" style={{ color: "#6A8F6D" }}>□</span>
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: "#0B1F18" }}>
                  {it.label}
                </div>
                {it.detail && (
                  <div className="text-xs mt-0.5" style={{ color: "#50625A" }}>
                    {it.detail}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type GuideTableProps = {
  headers: string[];
  rows: (string | ReactNode)[][];
  variant?: "default" | "compare";
  highlightFirstColumn?: boolean;
};

export function GuideTable({ headers, rows, variant = "default", highlightFirstColumn = false }: GuideTableProps) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(16,56,38,0.10)" }}>
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#103826", color: "#FFFDF8" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left p-3 font-bold text-[12px] uppercase tracking-wider"
                style={{ borderRight: i < headers.length - 1 ? "1px solid rgba(250,246,239,0.1)" : "none" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? "#FFFDF8" : "#FAF6EF",
                borderTop: "1px solid rgba(16,56,38,0.06)",
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="p-3 align-top"
                  style={{
                    color: highlightFirstColumn && ci === 0 ? "#0B1F18" : "#50625A",
                    fontWeight: highlightFirstColumn && ci === 0 ? 600 : 400,
                    borderRight: ci < row.length - 1 ? "1px solid rgba(16,56,38,0.04)" : "none",
                    fontSize: highlightFirstColumn && ci === 0 ? "13px" : "13px",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type GuideSectionProps = {
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  bg?: "ivory" | "sage";
};

export function GuideSection({ id, number, title, subtitle, children, bg = "ivory" }: GuideSectionProps) {
  return (
    <section
      id={id}
      className="py-20"
      style={{
        background: bg === "sage" ? "rgba(106,143,109,0.03)" : "#FAF6EF",
      }}
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-10">
          {number && (
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#A38010" }}>
              {number}
            </div>
          )}
          <h2
            className="font-serif text-[clamp(1.75rem,3.2vw,2.5rem)] font-bold tracking-[-0.03em] leading-[1.1] mb-3"
            style={{ fontFamily: "Playfair Display, serif", color: "#0B1F18" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "#6A8F6D" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="prose-custom">{children}</div>
      </div>
    </section>
  );
}

type SommaireItem = {
  id: string;
  label: string;
  number: string;
};

type SommaireProps = {
  items: SommaireItem[];
};

export function Sommaire({ items }: SommaireProps) {
  return (
    <nav
      className="my-8 rounded-2xl border p-6"
      style={{
        borderColor: "rgba(16,56,38,0.10)",
        background: "#FFFDF8",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📑</span>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#103826" }}>
          Sommaire
        </h3>
      </div>
      <ol className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            <a
              href={`#${item.id}`}
              className="flex items-center gap-3 py-1.5 transition-colors"
              style={{ color: "#50625A", textDecoration: "none" }}
            >
              <span
                className="flex-shrink-0 w-7 text-[11px] font-bold"
                style={{ color: "#A38010", fontFamily: "Playfair Display, serif" }}
              >
                {item.number}
              </span>
              <span className="flex-1 hover:underline">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

type GuideHeroProps = {
  badge?: string;
  title: string;
  subtitle: string;
  meta?: { label: string; value: string }[];
};

export function GuideHero({ badge, title, subtitle, meta }: GuideHeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-10%] right-[5%] w-[420px] h-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(228,177,24,0.10), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[5%] w-[420px] h-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,56,38,0.06), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
        {badge && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold mb-6"
            style={{
              borderColor: "rgba(228,177,24,0.25)",
              color: "#A38010",
              background: "rgba(228,177,24,0.08)",
            }}
          >
            <span>{badge}</span>
          </div>
        )}
        <h1
          className="text-[clamp(2rem,4.2vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em] mb-5"
          style={{ fontFamily: "Playfair Display, serif", color: "#0B1F18" }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: "#50625A" }}>
          {subtitle}
        </p>
        {meta && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {meta.map((m) => (
              <div key={m.label} className="flex items-center gap-2 text-xs">
                <span className="font-semibold" style={{ color: "#0B1F18" }}>
                  {m.value}
                </span>
                <span style={{ color: "#6A8F6D" }}>· {m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type SubSectionProps = {
  title: string;
  children: ReactNode;
  icon?: string;
};

export function SubSection({ title, children, icon }: SubSectionProps) {
  return (
    <div className="mb-8">
      <h3
        className="text-lg font-bold mb-3 flex items-center gap-2"
        style={{ color: "#0B1F18" }}
      >
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </h3>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: "#50625A" }}>
        {children}
      </div>
    </div>
  );
}

type Step = {
  title: string;
  desc: string;
  tip?: string;
};

type StepsProps = {
  steps: Step[];
};

export function Steps({ steps }: StepsProps) {
  return (
    <div className="my-6 space-y-3">
      {steps.map((s, i) => (
        <div
          key={i}
          className="rounded-xl border p-5 flex gap-4"
          style={{
            borderColor: "rgba(16,56,38,0.08)",
            background: "#FFFDF8",
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
            style={{
              background: "linear-gradient(135deg, #E4B118, #C99A0E)",
              color: "#082E1E",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {i + 1}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold mb-1" style={{ color: "#0B1F18" }}>
              {s.title}
            </h4>
            <p className="text-sm leading-relaxed mb-2" style={{ color: "#50625A" }}>
              {s.desc}
            </p>
            {s.tip && (
              <div
                className="text-xs italic pl-3 mt-2"
                style={{
                  color: "#A38010",
                  borderLeft: "2px solid #E4B118",
                }}
              >
                {s.tip}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
