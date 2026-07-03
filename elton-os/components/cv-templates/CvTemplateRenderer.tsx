"use client";

import type { CvRenderData } from "./cv-template-types";
import CvAutoFit from "./CvAutoFit";
import AtsClassicTemplate from "./AtsClassicTemplate";
import ModernExecutiveTemplate from "./ModernExecutiveTemplate";
import PremiumLeadershipTemplate from "./PremiumLeadershipTemplate";
import ExecutiveBordeauxTemplate from "./ExecutiveBordeauxTemplate";
import StrategicBlueTemplate from "./StrategicBlueTemplate";
import MinimalLuxeTemplate from "./MinimalLuxeTemplate";

/**
 * Rendu d'un template CV dans un conteneur A4 auto-ajustable.
 * CvAutoFit garantit que le contenu rentre toujours sur une seule page.
 */
export default function CvTemplateRenderer({ data }: { data: CvRenderData }) {
  const tpl = data.template;
  let child: React.ReactNode;

  switch (tpl) {
    case "modern_executive":
      child = <ModernExecutiveTemplate data={data} />;
      break;
    case "premium_leadership":
      child = <PremiumLeadershipTemplate data={data} />;
      break;
    case "executive_bordeaux":
      child = <ExecutiveBordeauxTemplate data={data} />;
      break;
    case "strategic_blue":
      child = <StrategicBlueTemplate data={data} />;
      break;
    case "minimal_luxe":
      child = <MinimalLuxeTemplate data={data} />;
      break;
    case "ats_classic":
    default:
      child = <AtsClassicTemplate data={data} />;
      break;
  }

  return <CvAutoFit>{child}</CvAutoFit>;
}
