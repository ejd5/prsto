"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Conteneur A4 qui s'assure que le CV tient sur une page et occupe tout l'espace disponible.
 */
export default function CvAutoFit({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 6;
    let bestZoom = 1;

    const measure = () => {
      if (!containerRef.current || !contentRef.current) return;
      attempts++;

      // Reset to measure naturally
      contentRef.current.style.zoom = "1";
      contentRef.current.style.height = "auto";

      const containerH = containerRef.current.clientHeight || 1122;
      const naturalH = contentRef.current.scrollHeight;

      if (containerH > 0 && naturalH > 0 && naturalH > containerH) {
        // Content overflows → zoom out to fit perfectly
        bestZoom = Math.min(bestZoom, containerH / naturalH);
      }

      contentRef.current.style.zoom = bestZoom.toString();
      contentRef.current.style.height = "100%";

      if (attempts < maxAttempts) {
        requestAnimationFrame(() => setTimeout(measure, 200));
      }
    };

    const timer = setTimeout(measure, 100);
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: 1122,
        overflow: "hidden",
        background: "#fff",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
