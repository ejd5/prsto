"use client";

import { X, CheckCircle2, ArrowRight } from "lucide-react";

interface ApplicationCreatedModalProps {
  open: boolean;
  jobTitle: string;
  company: string;
  draftId: string;
  onViewDraft: () => void;
  onClose: () => void;
}

export default function ApplicationCreatedModal({
  open, jobTitle, company, draftId, onViewDraft, onClose,
}: ApplicationCreatedModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      }}
    >
      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d0d0d",
          border: "1px solid #c9a03a",
          borderRadius: 12,
          maxWidth: 440,
          width: "calc(100% - 2rem)",
          padding: "2rem 1.75rem 1.5rem",
          boxShadow: "0 0 60px rgba(201,160,58,0.12), 0 8px 40px rgba(0,0,0,0.5)",
          animation: "prstoFadeIn 0.25s ease-out",
          position: "relative",
        }}
      >
        <style>{`
          @keyframes prstoFadeIn {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "none", border: "none", cursor: "pointer",
            color: "#666", padding: 4, borderRadius: 4,
          }}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(34,197,94,0.1)", display: "inline-flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle2 size={28} style={{ color: "#22c55e" }} />
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          textAlign: "center", fontSize: "1.1rem", fontWeight: 700,
          color: "var(--texte, #e0e0e0)", margin: "0 0 4px",
        }}>
          Dossier de candidature généré
        </h2>

        {/* Subtitle */}
        <p style={{
          textAlign: "center", fontSize: "0.8rem",
          color: "var(--texte-secondaire, #888)", margin: "0 0 16px",
        }}>
          Votre dossier est prêt pour :
        </p>

        {/* Job info */}
        <div style={{
          background: "#111", borderRadius: 8,
          border: "1px solid #222", padding: "12px 16px",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e0e0e0" }}>
            {jobTitle}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
            {company}
          </div>
        </div>

        {/* Badge */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 4,
            fontSize: "0.7rem", fontWeight: 600,
            background: "rgba(34,197,94,0.1)", color: "#22c55e",
          }}>
            Prêt
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: "0.7rem", color: "#666", textAlign: "center",
          margin: "0 0 20px", lineHeight: 1.5,
        }}>
          CV adapté, lettre, email, réponses ATS et analyse ont été préparés.
          Vérifiez le dossier avant d&rsquo;envoyer votre candidature.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { onViewDraft(); }}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "none", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 600,
              background: "linear-gradient(135deg, #c9a03a, #d4a84b)",
              color: "#000", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
            }}
          >
            Voir le dossier <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px", borderRadius: 8,
              border: "1px solid #333", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 500,
              background: "transparent", color: "#888",
            }}
          >
            Rester sur les offres
          </button>
        </div>

        {/* Footer */}
        <p style={{
          fontSize: "0.62rem", color: "#444", textAlign: "center",
          margin: "14px 0 0", lineHeight: 1.4,
        }}>
          ID dossier : {draftId.slice(0, 8)}&hellip;
        </p>
      </div>
    </div>
  );
}
