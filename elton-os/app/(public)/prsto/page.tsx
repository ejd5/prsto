import {
  LandingHeader,
  HeroSection,
  TrustBand,
  StatsSection,
  FeatureGrid,
  ProductMockup,
  HowItWorks,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  FinalCta,
  LandingFooter,
  ScrollProgress,
} from "@/components/landing";
import ExtensionSection from "@/components/landing/ExtensionSection";

export const metadata = {
  title: "PRSTO — La carrière d'exception mérite une recherche d'exception",
  description:
    "Plateforme IA premium pour cadres dirigeants : scoring d'offres, Boardroom Studio, CV Maître, STAR Simulator. Pilotez votre carrière vers le Comex.",
  openGraph: {
    title: "PRSTO — Copilote carrière IA pour cadres dirigeants",
    description: "Votre prochain poste de direction ne se trouve pas. Il se prépare.",
    type: "website",
  },
};

export default function PrstoLandingPage() {
  return (
    <>
      <ScrollProgress />
      <LandingHeader />
      <main>
        <HeroSection />
        <TrustBand />
        <StatsSection />
        <FeatureGrid />
        <ExtensionSection />
        <ProductMockup />
        <HowItWorks />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
