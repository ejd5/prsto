"use client";

import EltonModal from "./EltonModal";

interface SuccessActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action callback */
  onAction?: () => void;
  icon?: "check" | "sparkles" | "rocket";
}

export default function SuccessActionModal({ open, onClose, title, message, actionLabel, onAction, icon = "check" }: SuccessActionModalProps) {
  const icons = {
    check: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    sparkles: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1-8.313-12.454z" /><path d="M17 4a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2z" /><path d="M19 11h2" /><path d="M3 12h2" />
      </svg>
    ),
    rocket: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  };

  return (
    <EltonModal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center gap-4 py-3">
        <div className="animate-bounce-subtle">{icons[icon]}</div>
        <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>{message}</p>
        <div className="flex gap-3 mt-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 text-sm font-medium rounded-lg"
              style={{ background: "var(--or)", color: "#000" }}
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-lg border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte)" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </EltonModal>
  );
}
