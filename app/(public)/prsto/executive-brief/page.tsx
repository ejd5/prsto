import ExecutiveBriefHeader from "@/components/executive-brief/ExecutiveBriefHeader";
import ExecutiveBriefHero from "@/components/executive-brief/ExecutiveBriefHero";
import ProblemSection from "@/components/executive-brief/ProblemSection";
import DeliverablesGrid from "@/components/executive-brief/DeliverablesGrid";
import LinkedInAuditSection from "@/components/executive-brief/LinkedInAuditSection";
import ComparisonSection from "@/components/executive-brief/ComparisonSection";
import ValueSection from "@/components/executive-brief/ValueSection";
import ExecutiveBriefFaq from "@/components/executive-brief/ExecutiveBriefFaq";
import ExecutiveBriefCta from "@/components/executive-brief/ExecutiveBriefCta";

export default function ExecutiveBriefPage() {
  return (
    <>
      <ExecutiveBriefHeader />
      <ExecutiveBriefHero />
      <ProblemSection />
      <DeliverablesGrid />
      <LinkedInAuditSection />
      <ComparisonSection />
      <ValueSection />
      <ExecutiveBriefFaq />
      <ExecutiveBriefCta />
    </>
  );
}