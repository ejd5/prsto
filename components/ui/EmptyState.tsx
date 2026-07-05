"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  secondaryLink?: { label: string; href: string };
}

export default function EmptyState({ icon, title, message, action, secondaryLink }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4" role="status">
      <div className="mb-4 opacity-40">{icon}</div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-texte-secondaire max-w-md mb-5">{message}</p>
      {action && (
        <button onClick={action.onClick} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-or text-prsto-forest hover:opacity-90 transition-opacity">
          {action.label}
        </button>
      )}
      {secondaryLink && (
        <a href={secondaryLink.href} className="text-xs text-texte-secondaire mt-3 underline opacity-60 hover:opacity-100">
          {secondaryLink.label}
        </a>
      )}
    </div>
  );
}
