"use client";

import type { CvRenderData } from "./cv-template-types";
import AtsClassicTemplate from "./AtsClassicTemplate";
import ModernExecutiveTemplate from "./ModernExecutiveTemplate";
import PremiumLeadershipTemplate from "./PremiumLeadershipTemplate";

export default function CvTemplateRenderer({ data }: { data: CvRenderData }) {
  switch (data.template) {
    case "modern_executive":
      return <ModernExecutiveTemplate data={data} />;
    case "premium_leadership":
      return <PremiumLeadershipTemplate data={data} />;
    case "ats_classic":
    default:
      return <AtsClassicTemplate data={data} />;
  }
}
