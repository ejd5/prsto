import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function RessourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6EF" }}>
      <LandingHeader />
      <div className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">{children}</div>
      <LandingFooter />
    </div>
  );
}
