
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  plan: 'plan',
  company: 'company',
  phone: 'phone',
  image: 'image',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  email: 'email',
  name: 'name',
  image: 'image',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  status: 'status',
  plan: 'plan',
  seatsUsed: 'seatsUsed',
  seatsLimit: 'seatsLimit',
  customDomain: 'customDomain',
  primaryColor: 'primaryColor',
  logoUrl: 'logoUrl',
  defaultLanguage: 'defaultLanguage',
  contactName: 'contactName',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  commissionRate: 'commissionRate',
  stripeAccountId: 'stripeAccountId',
  totalCommission: 'totalCommission',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationMemberScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  userId: 'userId',
  role: 'role',
  invitedBy: 'invitedBy',
  invitedAt: 'invitedAt',
  joinedAt: 'joinedAt',
  status: 'status'
};

exports.Prisma.OrganizationInvitationScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  email: 'email',
  role: 'role',
  token: 'token',
  invitedBy: 'invitedBy',
  expiresAt: 'expiresAt',
  acceptedAt: 'acceptedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  fullName: 'fullName',
  title: 'title',
  summary: 'summary',
  phone: 'phone',
  email: 'email',
  linkedin: 'linkedin',
  location: 'location',
  photoUrl: 'photoUrl',
  mobility: 'mobility',
  languages: 'languages',
  yearsExp: 'yearsExp',
  sectors: 'sectors',
  functions: 'functions',
  education: 'education',
  certifications: 'certifications',
  remotePreference: 'remotePreference',
  targetSalary: 'targetSalary',
  constraints: 'constraints',
  preferredTone: 'preferredTone',
  cvDefaultTemplate: 'cvDefaultTemplate',
  cvIncludePhoto: 'cvIncludePhoto',
  cvIncludeLinkedIn: 'cvIncludeLinkedIn',
  cvAccentColor: 'cvAccentColor',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SkillScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  name: 'name',
  category: 'category',
  level: 'level',
  source: 'source',
  verifiedAt: 'verifiedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ExperienceScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  company: 'company',
  title: 'title',
  sector: 'sector',
  country: 'country',
  startDate: 'startDate',
  endDate: 'endDate',
  description: 'description',
  responsibilities: 'responsibilities',
  teamSize: 'teamSize',
  revenue: 'revenue',
  budget: 'budget',
  tools: 'tools',
  achievements: 'achievements',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.CVMasterScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  fileName: 'fileName',
  originalText: 'originalText',
  parsedJson: 'parsedJson',
  fileType: 'fileType',
  fileSize: 'fileSize',
  status: 'status',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.ProofEntryScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  experienceId: 'experienceId',
  category: 'category',
  title: 'title',
  value: 'value',
  context: 'context',
  period: 'period',
  confidence: 'confidence',
  verifiable: 'verifiable',
  isConfidential: 'isConfidential',
  usableForCV: 'usableForCV',
  usableForLetter: 'usableForLetter',
  sendableToAI: 'sendableToAI',
  documentUrl: 'documentUrl',
  linkedSkills: 'linkedSkills',
  createdAt: 'createdAt'
};

exports.Prisma.JobSourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  region: 'region',
  type: 'type',
  priority: 'priority',
  active: 'active',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.PriorityRoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  rank: 'rank',
  active: 'active',
  createdAt: 'createdAt'
};

exports.Prisma.TargetCountryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  region: 'region',
  priority: 'priority',
  active: 'active',
  createdAt: 'createdAt'
};

exports.Prisma.MarketRadarScalarFieldEnum = {
  id: 'id',
  jobSourceId: 'jobSourceId',
  role: 'role',
  country: 'country',
  searchUrl: 'searchUrl',
  notes: 'notes',
  lastChecked: 'lastChecked',
  createdAt: 'createdAt'
};

exports.Prisma.RadarCandidateScalarFieldEnum = {
  id: 'id',
  source: 'source',
  sourceType: 'sourceType',
  sourceUrl: 'sourceUrl',
  applyUrl: 'applyUrl',
  externalId: 'externalId',
  title: 'title',
  company: 'company',
  location: 'location',
  remote: 'remote',
  contractType: 'contractType',
  salary: 'salary',
  description: 'description',
  publishedAt: 'publishedAt',
  detectedAts: 'detectedAts',
  score: 'score',
  priority: 'priority',
  reasonsJson: 'reasonsJson',
  risksJson: 'risksJson',
  matchedKeywordsJson: 'matchedKeywordsJson',
  missingKeywordsJson: 'missingKeywordsJson',
  duplicateStatus: 'duplicateStatus',
  duplicateOfId: 'duplicateOfId',
  importedOpportunityId: 'importedOpportunityId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OpportunityScalarFieldEnum = {
  id: 'id',
  title: 'title',
  company: 'company',
  location: 'location',
  country: 'country',
  sourceUrl: 'sourceUrl',
  sourceName: 'sourceName',
  jobSourceId: 'jobSourceId',
  rawText: 'rawText',
  salaryMin: 'salaryMin',
  salaryMax: 'salaryMax',
  salaryCurrency: 'salaryCurrency',
  contractType: 'contractType',
  remote: 'remote',
  status: 'status',
  score: 'score',
  priority: 'priority',
  notes: 'notes',
  appliedAt: 'appliedAt',
  normalizedTitle: 'normalizedTitle',
  normalizedCompany: 'normalizedCompany',
  normalizedLocation: 'normalizedLocation',
  descriptionFingerprint: 'descriptionFingerprint',
  duplicateGroupId: 'duplicateGroupId',
  duplicateScore: 'duplicateScore',
  duplicateStatus: 'duplicateStatus',
  canonicalOpportunityId: 'canonicalOpportunityId',
  externalId: 'externalId',
  sourceType: 'sourceType',
  geoScore: 'geoScore',
  geoPriority: 'geoPriority',
  roleScore: 'roleScore',
  globalScore: 'globalScore',
  matchedRoles: 'matchedRoles',
  matchedCity: 'matchedCity',
  firstSeenAt: 'firstSeenAt',
  lastSeenAt: 'lastSeenAt',
  isNew: 'isNew',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AnalysisScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  scoreGlobal: 'scoreGlobal',
  keywordsAts: 'keywordsAts',
  exigences: 'exigences',
  risks: 'risks',
  gaps: 'gaps',
  pointsForts: 'pointsForts',
  matchDetails: 'matchDetails',
  rawResponse: 'rawResponse',
  aiModel: 'aiModel',
  analysedAt: 'analysedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  type: 'type',
  content: 'content',
  status: 'status',
  validatedAt: 'validatedAt',
  exportedAt: 'exportedAt',
  exportFormat: 'exportFormat',
  version: 'version',
  createdAt: 'createdAt'
};

exports.Prisma.ChangeLogScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  section: 'section',
  field: 'field',
  oldValue: 'oldValue',
  newValue: 'newValue',
  reason: 'reason',
  source: 'source',
  risque: 'risque',
  statut: 'statut',
  createdAt: 'createdAt'
};

exports.Prisma.PipelineTaskScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  column: 'column',
  order: 'order',
  notes: 'notes',
  nextStep: 'nextStep',
  nextStepDate: 'nextStepDate',
  lastStatusChange: 'lastStatusChange',
  recruiterName: 'recruiterName',
  recruiterTitle: 'recruiterTitle',
  recruiterEmail: 'recruiterEmail',
  recruiterLinkedin: 'recruiterLinkedin',
  recruiterPhone: 'recruiterPhone',
  cabinetName: 'cabinetName',
  contactNotes: 'contactNotes',
  contactSource: 'contactSource',
  updatedAt: 'updatedAt'
};

exports.Prisma.RelanceScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  type: 'type',
  date: 'date',
  notes: 'notes',
  status: 'status',
  templateUsed: 'templateUsed',
  content: 'content',
  scheduledDate: 'scheduledDate',
  createdAt: 'createdAt'
};

exports.Prisma.InterviewScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  type: 'type',
  date: 'date',
  interviewer: 'interviewer',
  notes: 'notes',
  questions: 'questions',
  strengths: 'strengths',
  weaknesses: 'weaknesses',
  nextSteps: 'nextSteps',
  preparation: 'preparation',
  sections: 'sections',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.RecruiterContactScalarFieldEnum = {
  id: 'id',
  fullName: 'fullName',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  linkedinUrl: 'linkedinUrl',
  roleTitle: 'roleTitle',
  companyName: 'companyName',
  firmName: 'firmName',
  contactType: 'contactType',
  source: 'source',
  location: 'location',
  notes: 'notes',
  tagsJson: 'tagsJson',
  relationshipStrength: 'relationshipStrength',
  lastContactedAt: 'lastContactedAt',
  nextFollowUpAt: 'nextFollowUpAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyTargetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  website: 'website',
  linkedinUrl: 'linkedinUrl',
  sector: 'sector',
  size: 'size',
  location: 'location',
  targetPriority: 'targetPriority',
  notes: 'notes',
  tagsJson: 'tagsJson',
  lastInteractionAt: 'lastInteractionAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactInteractionScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  companyTargetId: 'companyTargetId',
  applicationDraftId: 'applicationDraftId',
  jobId: 'jobId',
  type: 'type',
  direction: 'direction',
  subject: 'subject',
  body: 'body',
  outcome: 'outcome',
  occurredAt: 'occurredAt',
  nextActionAt: 'nextActionAt',
  createdAt: 'createdAt'
};

exports.Prisma.InterviewPrepScalarFieldEnum = {
  id: 'id',
  applicationDraftId: 'applicationDraftId',
  jobId: 'jobId',
  contactId: 'contactId',
  companyName: 'companyName',
  roleTitle: 'roleTitle',
  interviewStage: 'interviewStage',
  interviewDate: 'interviewDate',
  prepStatus: 'prepStatus',
  executiveSummary: 'executiveSummary',
  companyBrief: 'companyBrief',
  roleFitSummary: 'roleFitSummary',
  candidatePitchShort: 'candidatePitchShort',
  candidatePitchLong: 'candidatePitchLong',
  likelyQuestionsJson: 'likelyQuestionsJson',
  starAnswersJson: 'starAnswersJson',
  objectionsJson: 'objectionsJson',
  questionsToAskJson: 'questionsToAskJson',
  compensationStrategy: 'compensationStrategy',
  thirtySixtyNinetyPlan: 'thirtySixtyNinetyPlan',
  risksJson: 'risksJson',
  strengthsJson: 'strengthsJson',
  gapsJson: 'gapsJson',
  followUpEmail: 'followUpEmail',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SettingScalarFieldEnum = {
  id: 'id',
  aiProvider: 'aiProvider',
  apiKey: 'apiKey',
  baseUrl: 'baseUrl',
  defaultModel: 'defaultModel',
  proModel: 'proModel',
  timeout: 'timeout',
  temperature: 'temperature',
  confidentialityMode: 'confidentialityMode',
  anonymizeName: 'anonymizeName',
  anonymizeEmail: 'anonymizeEmail',
  anonymizePhone: 'anonymizePhone',
  anonymizeCompanies: 'anonymizeCompanies',
  anonymizeSalary: 'anonymizeSalary',
  localFallbackEnabled: 'localFallbackEnabled',
  anonymizeBeforeCall: 'anonymizeBeforeCall',
  autoExport: 'autoExport',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIPromptScalarFieldEnum = {
  id: 'id',
  name: 'name',
  label: 'label',
  description: 'description',
  systemPrompt: 'systemPrompt',
  content: 'content',
  variables: 'variables',
  preferredModel: 'preferredModel',
  temperature: 'temperature',
  outputSchema: 'outputSchema',
  active: 'active',
  updatedAt: 'updatedAt'
};

exports.Prisma.DuplicateGroupScalarFieldEnum = {
  id: 'id',
  canonicalId: 'canonicalId',
  memberIds: 'memberIds',
  averageScore: 'averageScore',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ImportSourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  enabled: 'enabled',
  configJson: 'configJson',
  lastRunAt: 'lastRunAt',
  status: 'status',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SafeJobSourceScalarFieldEnum = {
  id: 'id',
  label: 'label',
  url: 'url',
  normalizedDomain: 'normalizedDomain',
  sourceType: 'sourceType',
  atsVendor: 'atsVendor',
  importMode: 'importMode',
  enabled: 'enabled',
  maxPagesPerRun: 'maxPagesPerRun',
  maxJobsPerRun: 'maxJobsPerRun',
  lastRunAt: 'lastRunAt',
  lastStatus: 'lastStatus',
  lastReasonCode: 'lastReasonCode',
  lastJobsFound: 'lastJobsFound',
  lastJobsImported: 'lastJobsImported',
  lastError: 'lastError',
  consecutiveErrors: 'consecutiveErrors',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BrowserSearchConfigScalarFieldEnum = {
  id: 'id',
  platform: 'platform',
  label: 'label',
  searchUrl: 'searchUrl',
  enabled: 'enabled',
  maxResultsPerRun: 'maxResultsPerRun',
  locationPriority: 'locationPriority',
  scrollEnabled: 'scrollEnabled',
  maxScrolls: 'maxScrolls',
  scrollDelayMs: 'scrollDelayMs',
  fetchDetailsEnabled: 'fetchDetailsEnabled',
  maxDetailsPerRun: 'maxDetailsPerRun',
  lastRunAt: 'lastRunAt',
  lastError: 'lastError',
  lastOffersFound: 'lastOffersFound',
  lastDetailsFetched: 'lastDetailsFetched',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobSearchRunScalarFieldEnum = {
  id: 'id',
  sourceId: 'sourceId',
  mode: 'mode',
  status: 'status',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  fetchedCount: 'fetchedCount',
  createdCount: 'createdCount',
  updatedCount: 'updatedCount',
  duplicateCount: 'duplicateCount',
  rejectedCount: 'rejectedCount',
  errorMessage: 'errorMessage',
  logsJson: 'logsJson',
  createdAt: 'createdAt'
};

exports.Prisma.RawJobScalarFieldEnum = {
  id: 'id',
  sourceId: 'sourceId',
  externalId: 'externalId',
  sourceUrl: 'sourceUrl',
  canonicalUrl: 'canonicalUrl',
  rawTitle: 'rawTitle',
  rawCompany: 'rawCompany',
  rawLocation: 'rawLocation',
  rawDescription: 'rawDescription',
  rawPayloadJson: 'rawPayloadJson',
  rawHtml: 'rawHtml',
  checksum: 'checksum',
  fetchedAt: 'fetchedAt'
};

exports.Prisma.JobScalarFieldEnum = {
  id: 'id',
  sourceId: 'sourceId',
  externalId: 'externalId',
  sourceUrl: 'sourceUrl',
  canonicalUrl: 'canonicalUrl',
  title: 'title',
  company: 'company',
  location: 'location',
  locationPriority: 'locationPriority',
  countryScope: 'countryScope',
  remotePolicy: 'remotePolicy',
  contractType: 'contractType',
  salaryMin: 'salaryMin',
  salaryMax: 'salaryMax',
  currency: 'currency',
  seniority: 'seniority',
  functionArea: 'functionArea',
  sector: 'sector',
  description: 'description',
  publishedAt: 'publishedAt',
  firstSeenAt: 'firstSeenAt',
  lastSeenAt: 'lastSeenAt',
  status: 'status',
  checksum: 'checksum',
  notes: 'notes',
  priority: 'priority',
  appliedAt: 'appliedAt',
  remote: 'remote',
  salaryCurrency: 'salaryCurrency',
  rawText: 'rawText',
  sourceName: 'sourceName',
  country: 'country',
  duplicateGroupId: 'duplicateGroupId',
  duplicateScore: 'duplicateScore',
  duplicateStatus: 'duplicateStatus',
  canonicalOpportunityId: 'canonicalOpportunityId',
  sourceType: 'sourceType',
  matchedRoles: 'matchedRoles',
  matchedCity: 'matchedCity',
  isNew: 'isNew',
  geoScore: 'geoScore',
  geoPriority: 'geoPriority',
  roleScore: 'roleScore',
  globalScore: 'globalScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JobScoreScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  executiveScore: 'executiveScore',
  matchScore: 'matchScore',
  locationScore: 'locationScore',
  salaryScore: 'salaryScore',
  freshnessScore: 'freshnessScore',
  companyScore: 'companyScore',
  riskScore: 'riskScore',
  globalScore: 'globalScore',
  reasonsJson: 'reasonsJson',
  redFlagsJson: 'redFlagsJson',
  recommendedAction: 'recommendedAction',
  semanticScore: 'semanticScore',
  semanticConfidence: 'semanticConfidence',
  semanticAnalysisJson: 'semanticAnalysisJson',
  recommendation: 'recommendation',
  createdAt: 'createdAt'
};

exports.Prisma.ApplicationDraftScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  contactId: 'contactId',
  candidateProfileId: 'candidateProfileId',
  status: 'status',
  pipelineStatus: 'pipelineStatus',
  sentAt: 'sentAt',
  followUpDueAt: 'followUpDueAt',
  followedUpAt: 'followedUpAt',
  recruiterRepliedAt: 'recruiterRepliedAt',
  interviewAt: 'interviewAt',
  lastPipelineActionAt: 'lastPipelineActionAt',
  matchScore: 'matchScore',
  jobSummary: 'jobSummary',
  keyRequirements: 'keyRequirements',
  atsKeywords: 'atsKeywords',
  confirmedMatches: 'confirmedMatches',
  gaps: 'gaps',
  risks: 'risks',
  tailoredResumeDocumentId: 'tailoredResumeDocumentId',
  motivationLetterDocumentId: 'motivationLetterDocumentId',
  tailoredResumeContent: 'tailoredResumeContent',
  motivationLetterLong: 'motivationLetterLong',
  motivationLetterShort: 'motivationLetterShort',
  applicationEmail: 'applicationEmail',
  recruiterMessage: 'recruiterMessage',
  atsFormAnswers: 'atsFormAnswers',
  changeLogJson: 'changeLogJson',
  generationLogs: 'generationLogs',
  cvVersion: 'cvVersion',
  coverLetter: 'coverLetter',
  excitement: 'excitement',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssistedApplySessionScalarFieldEnum = {
  id: 'id',
  applicationDraftId: 'applicationDraftId',
  jobId: 'jobId',
  sourceUrl: 'sourceUrl',
  platform: 'platform',
  status: 'status',
  detectedFieldsJson: 'detectedFieldsJson',
  suggestedAnswersJson: 'suggestedAnswersJson',
  warningsJson: 'warningsJson',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SourcingRunScalarFieldEnum = {
  id: 'id',
  status: 'status',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  sourcesAttempted: 'sourcesAttempted',
  sourcesSucceeded: 'sourcesSucceeded',
  offersFound: 'offersFound',
  offersNew: 'offersNew',
  offersDuplicates: 'offersDuplicates',
  summary: 'summary',
  errors: 'errors',
  createdAt: 'createdAt'
};

exports.Prisma.SourcingReportScalarFieldEnum = {
  id: 'id',
  type: 'type',
  date: 'date',
  content: 'content',
  sourceRunId: 'sourceRunId',
  sent: 'sent',
  createdAt: 'createdAt'
};

exports.Prisma.ContactLeadScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  profile: 'profile',
  message: 'message',
  createdAt: 'createdAt'
};

exports.Prisma.OpportunityTodoScalarFieldEnum = {
  id: 'id',
  opportunityId: 'opportunityId',
  jobId: 'jobId',
  title: 'title',
  done: 'done',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandidateScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  offerTitle: 'offerTitle',
  company: 'company',
  cvText: 'cvText',
  offerText: 'offerText',
  atsScore: 'atsScore',
  atsData: 'atsData',
  cvOptimized: 'cvOptimized',
  coverLetter: 'coverLetter',
  interviewBrief: 'interviewBrief',
  interviewQuestions: 'interviewQuestions',
  linkedinOpts: 'linkedinOpts',
  notes: 'notes',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecruiterClientScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  company: 'company',
  contactName: 'contactName',
  email: 'email',
  phone: 'phone',
  website: 'website',
  sector: 'sector',
  notes: 'notes',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecruiterMissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  clientId: 'clientId',
  title: 'title',
  location: 'location',
  contractType: 'contractType',
  salary: 'salary',
  description: 'description',
  status: 'status',
  fee: 'fee',
  feeType: 'feeType',
  deadline: 'deadline',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MissionCandidateScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  candidateId: 'candidateId',
  status: 'status',
  proposedAt: 'proposedAt',
  interviewAt: 'interviewAt',
  feedback: 'feedback',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandidateDossierScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  userId: 'userId',
  version: 'version',
  cvOptimized: 'cvOptimized',
  coverLetter: 'coverLetter',
  interviewBrief: 'interviewBrief',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.CandidateNoteScalarFieldEnum = {
  id: 'id',
  candidateId: 'candidateId',
  userId: 'userId',
  content: 'content',
  category: 'category',
  createdAt: 'createdAt'
};

exports.Prisma.MissionShareLinkScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  token: 'token',
  active: 'active',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.CommissionScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  missionCandidateId: 'missionCandidateId',
  userId: 'userId',
  amount: 'amount',
  status: 'status',
  paidAt: 'paidAt',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExecutiveBriefOrderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  linkedin: 'linkedin',
  role: 'role',
  company: 'company',
  cvPreview: 'cvPreview',
  createdAt: 'createdAt'
};

exports.Prisma.EmbeddingScalarFieldEnum = {
  id: 'id',
  entityType: 'entityType',
  entityId: 'entityId',
  content: 'content',
  embedding: 'embedding',
  model: 'model',
  dimensions: 'dimensions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Session: 'Session',
  Account: 'Account',
  Organization: 'Organization',
  OrganizationMember: 'OrganizationMember',
  OrganizationInvitation: 'OrganizationInvitation',
  Profile: 'Profile',
  Skill: 'Skill',
  Experience: 'Experience',
  CVMaster: 'CVMaster',
  ProofEntry: 'ProofEntry',
  JobSource: 'JobSource',
  PriorityRole: 'PriorityRole',
  TargetCountry: 'TargetCountry',
  MarketRadar: 'MarketRadar',
  RadarCandidate: 'RadarCandidate',
  Opportunity: 'Opportunity',
  Analysis: 'Analysis',
  Document: 'Document',
  ChangeLog: 'ChangeLog',
  PipelineTask: 'PipelineTask',
  Relance: 'Relance',
  Interview: 'Interview',
  RecruiterContact: 'RecruiterContact',
  CompanyTarget: 'CompanyTarget',
  ContactInteraction: 'ContactInteraction',
  InterviewPrep: 'InterviewPrep',
  Setting: 'Setting',
  AIPrompt: 'AIPrompt',
  DuplicateGroup: 'DuplicateGroup',
  ImportSource: 'ImportSource',
  SafeJobSource: 'SafeJobSource',
  BrowserSearchConfig: 'BrowserSearchConfig',
  JobSearchRun: 'JobSearchRun',
  RawJob: 'RawJob',
  Job: 'Job',
  JobScore: 'JobScore',
  ApplicationDraft: 'ApplicationDraft',
  AssistedApplySession: 'AssistedApplySession',
  SourcingRun: 'SourcingRun',
  SourcingReport: 'SourcingReport',
  ContactLead: 'ContactLead',
  OpportunityTodo: 'OpportunityTodo',
  Candidate: 'Candidate',
  RecruiterClient: 'RecruiterClient',
  RecruiterMission: 'RecruiterMission',
  MissionCandidate: 'MissionCandidate',
  CandidateDossier: 'CandidateDossier',
  CandidateNote: 'CandidateNote',
  MissionShareLink: 'MissionShareLink',
  Commission: 'Commission',
  ExecutiveBriefOrder: 'ExecutiveBriefOrder',
  Embedding: 'Embedding'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
