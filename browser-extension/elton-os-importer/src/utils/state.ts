// Global state — shared mutable singletons
export var capturedData: any = null;
export var candidateProfile: any = null;      // Recruteur: profil candidat sourcé
export var clientOffer: any = null;           // Recruteur: offre client à matcher
export var matchResult: any = null;           // Recruteur: résultat de matching
export var baseUrl = "http://localhost:3000";
export var currentTab = "import";
export var autofillFields: any[] = [];
export var detectedFields: any[] = [];
export var overwriteExisting = false;
export var importMode: string = "single";
export var backendOnline = false;
export var backendChecked = false;
export var documentsDraftId: string | null = null;
export var documentsStatus: any = null;
export var lastDownloadFilename: string | null = null;
export var selectedCvMode = "adapted";
export var lastDownloadId: number | null = null;
export var currentExcitement = 0;

export function getApiUrl(path: string): string {
  return (baseUrl || "http://localhost:3000") + path;
}

export function setCapturedData(v: any) { capturedData = v; }
export function setCandidateProfile(v: any) { candidateProfile = v; }
export function setClientOffer(v: any) { clientOffer = v; }
export function setMatchResult(v: any) { matchResult = v; }
export function setBaseUrl(v: string) { baseUrl = v; }
export function setCurrentTab(v: string) { currentTab = v; }
export function setAutofillFields(v: any[]) { autofillFields = v; }
export function setDetectedFields(v: any[]) { detectedFields = v; }
export function setOverwriteExisting(v: boolean) { overwriteExisting = v; }
export function setImportMode(v: string) { importMode = v; }
export function setBackendOnline(v: boolean) { backendOnline = v; }
export function setBackendChecked(v: boolean) { backendChecked = v; }
export function setDocumentsDraftId(v: string | null) { documentsDraftId = v; }
export function setDocumentsStatus(v: any) { documentsStatus = v; }
export function setLastDownloadFilename(v: string | null) { lastDownloadFilename = v; }
export function setSelectedCvMode(v: string) { selectedCvMode = v; }
export function setLastDownloadId(v: number | null) { lastDownloadId = v; }
export function setCurrentExcitement(v: number) { currentExcitement = v; }

export function resetState() {
  capturedData = null;
  documentsDraftId = null;
  documentsStatus = null;
  lastDownloadFilename = null;
  lastDownloadId = null;
  currentExcitement = 0;
}
