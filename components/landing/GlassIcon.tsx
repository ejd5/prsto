import type { LucideIcon } from "lucide-react";

export default function GlassIcon({ icon: Icon, size = 20, color = "#E4B118" }: { icon: LucideIcon; size?: number; color?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Icon size={size} style={{ color }} />
    </div>
  );
}
