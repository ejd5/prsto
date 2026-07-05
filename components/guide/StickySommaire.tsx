"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type SommaireItem = {
  id: string;
  label: string;
  number: string;
};

type StickySommaireProps = {
  items: SommaireItem[];
};

export default function StickySommaire({ items }: StickySommaireProps) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <aside
        className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border p-5"
        style={{
          borderColor: "rgba(16,56,38,0.10)",
          background: "#FFFDF8",
        }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
          <span className="text-base">📑</span>
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#103826" }}>
            Sommaire
          </h3>
        </div>
        <ol className="space-y-0.5">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-start gap-2 py-1.5 px-2 rounded-md text-[12.5px] transition-colors"
                  style={{
                    color: isActive ? "#103826" : "#50625A",
                    background: isActive ? "rgba(228,177,24,0.08)" : "transparent",
                    textDecoration: "none",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 text-[10px] font-bold mt-0.5"
                    style={{ color: "#A38010", fontFamily: "Playfair Display, serif" }}
                  >
                    {item.number}
                  </span>
                  <span className="flex-1 leading-snug">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        style={{
          background: "#103826",
          color: "#FFFDF8",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
        aria-label="Ouvrir le sommaire"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(11,31,24,0.6)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-auto rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            style={{ background: "#FAF6EF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "rgba(16,56,38,0.10)" }}>
              <div className="flex items-center gap-2">
                <span className="text-base">📑</span>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#103826" }}>
                  Sommaire
                </h3>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: "#50625A" }}>
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 py-2 px-2 rounded-md text-sm"
                    style={{ color: "#0B1F18", textDecoration: "none" }}
                  >
                    <span
                      className="flex-shrink-0 w-6 text-[11px] font-bold"
                      style={{ color: "#A38010", fontFamily: "Playfair Display, serif" }}
                    >
                      {item.number}
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
