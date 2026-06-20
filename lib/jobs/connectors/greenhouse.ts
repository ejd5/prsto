import type { JobConnector, ImportedJob, SearchQuery } from "../types";

export const greenhouseConnector: JobConnector = {
  id: "greenhouse",
  name: "Greenhouse ATS",
  type: "ats",

  async search(_query: SearchQuery): Promise<ImportedJob[]> {
    // TODO: Greenhouse — enrichir avec les boards des entreprises cibles
    // Pattern: https://boards.greenhouse.io/NOM_ENTREPRISE/jobs
    // Le connecteur n'est pas configuré en V1, retourne une liste vide
    return [];
  },
};
