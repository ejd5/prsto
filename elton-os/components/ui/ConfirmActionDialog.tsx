"use client";

import EltonModal from "./EltonModal";

interface ConfirmActionDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Color variant for destructive actions */
  destructive?: boolean;
  loading?: boolean;
}

export default function ConfirmActionDialog({
  open, onConfirm, onCancel, title, message,
  confirmLabel = "Confirmer", cancelLabel = "Annuler",
  destructive, loading,
}: ConfirmActionDialogProps) {
  return (
    <EltonModal open={open} onClose={onCancel} title={title}>
      <p className="text-sm mb-5" style={{ color: "var(--texte-secondaire)" }}>{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg transition-opacity disabled:opacity-50 border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte)" }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50 ${destructive ? "text-white" : "text-black"}`}
          style={{ background: destructive ? "#ef4444" : "var(--or)" }}
        >
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </EltonModal>
  );
}
