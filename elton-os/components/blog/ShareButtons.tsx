"use client";

import { Link, XLogo, FacebookLogo, Copy } from "@phosphor-icons/react";
import { useState } from "react";

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Link,
      color: "hover:text-[#0A66C2]",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: XLogo,
      color: "hover:text-[#000]",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FacebookLogo,
      color: "hover:text-[#1877F2]",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#50625A] mr-1">
        Partager
      </span>
      {shareLinks.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          className={`w-8 h-8 rounded-full border border-[#E6DED2] flex items-center justify-center text-[#50625A] transition-all duration-200 ${s.color} hover:border-[#E4B118] hover:shadow-sm`}
        >
          <s.icon size={14} weight="bold" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        aria-label="Copier le lien"
        className={`w-8 h-8 rounded-full border flex items-center justify-center text-[#50625A] transition-all duration-200 hover:border-[#E4B118] hover:shadow-sm ${
          copied ? "border-[#22c55e] text-[#22c55e]" : "border-[#E6DED2]"
        }`}
      >
        {copied ? (
          <span className="text-[9px] font-bold">OK</span>
        ) : (
          <Copy size={13} weight="bold" />
        )}
      </button>
    </div>
  );
}
