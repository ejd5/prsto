import type { JobConnector, ImportedJob, SearchQuery } from "../types";

export const smartRecruitersConnector: JobConnector = {
  id: "smartrecruiters",
  name: "SmartRecruiters ATS",
  type: "ats",

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    // TODO: SmartRecruiters expose une API publique
    // Documentation : https://dev.smartrecruiters.com/customer-api
    // Format : https://api.smartrecruiters.com/v1/companies/NOM_ENTREPRISE/postings
    // À implémenter avec les IDs des entreprises cibles
    //
    // Exemple de requête :
    // GET https://api.smartrecruiters.com/v1/companies/CompanyName/postings
    // Headers: { "User-Agent": "..." }
    // Retourne : { totalFound, content: [{ id, name, location, ... }] }
    console.warn("[SmartRecruiters] Connecteur non implémenté — nécessite les IDs des entreprises cibles");
    return [];
  },
};
