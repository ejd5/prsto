"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface EltonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional: custom width class */
  wide?: boolean;
  /** Optional: no close button (e.g. mandatory step) */
  noClose?: boolean;
}

export default function EltonModal({ open, onClose, title, children, wide, noClose }: EltonModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap and Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !noClose) onClose();
      // Focus trap: keep focus inside modal
      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, noClose]);

  // Focus first element on open
  useEffect(() => {
    if (open && contentRef.current) {
      const first = contentRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      setTimeout(() => first?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === overlayRef.current && !noClose) onClose(); }}
    >
      <div
        ref={contentRef}
        className={`rounded-xl max-h-[85vh] overflow-y-auto shadow-2xl border border-bordure bg-fond text-texte ${wide ? "w-full max-w-2xl" : "w-full max-w-md"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-bordure">
          <h2 className="text-base font-semibold">{title}</h2>
          {!noClose && (
            <button onClick={onClose} aria-label="Fermer" className="p-1 rounded text-texte-tertiaire hover:opacity-70 transition-opacity">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
