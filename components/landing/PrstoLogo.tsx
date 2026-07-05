"use client";

import Image from "next/image";

type PrstoLogoProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function PrstoLogo({ size = 80, className = "", style }: PrstoLogoProps) {
  const height = size / 4.2;
  return (
    <Image
      src="/branding/logo-prsto.png"
      alt="PRSTO"
      width={size}
      height={height}
      className={className}
      style={{ objectFit: "contain", display: "inline-block", ...style }}
    />
  );
}
