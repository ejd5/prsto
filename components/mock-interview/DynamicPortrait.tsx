"use client";

import { useState, useEffect } from "react";

interface DynamicPortraitProps {
  name: string;
  title: string;
  imageUrls: string[];
  isActive: boolean;
  size?: "sm" | "md" | "lg";
}

export function DynamicPortrait({
  name,
  title,
  imageUrls,
  isActive,
  size = "lg",
}: DynamicPortraitProps) {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (imageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % imageUrls.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [imageUrls.length]);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-44 h-44 md:w-52 md:h-52",
  };

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center gap-3 transition-all duration-500">
      <div
        className={`relative rounded-2xl overflow-hidden ${
          sizeClasses[size]
        } transition-all duration-500 ${
          isActive
            ? "ring-2 ring-[#103826] shadow-[0_0_25px_rgba(16,56,38,0.6)] scale-105"
            : "ring-1 ring-[#103826]/20 shadow-lg scale-100 opacity-70 grayscale-[30%]"
        }`}
      >
        <img
          src={imageUrls[currentImage] || imageUrls[0]}
          alt={name}
          className="w-full h-full object-cover"
        />

        {isActive && (
          <div className="absolute inset-0 rounded-2xl animate-pulse-halo pointer-events-none" />
        )}
      </div>

      <div className="text-center">
        <p
          className={`font-semibold text-[#103826] transition-all ${
            textSize[size]
          } ${isActive ? "opacity-100" : "opacity-70"}`}
        >
          {name}
        </p>
        <p
          className={`text-[#103826]/60 transition-all ${
            size === "lg" ? "text-xs" : "text-[10px]"
          } ${isActive ? "opacity-100" : "opacity-60"}`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
