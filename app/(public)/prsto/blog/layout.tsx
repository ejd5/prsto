import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF6EF" }}>
      <LandingHeader />
      <div className="flex-1 w-full">{children}</div>
      <LandingFooter />
    </div>
  );
}
