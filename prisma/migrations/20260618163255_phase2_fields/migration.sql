-- AlterTable
ALTER TABLE "Experience" ADD COLUMN "budget" TEXT;
ALTER TABLE "Experience" ADD COLUMN "country" TEXT;
ALTER TABLE "Experience" ADD COLUMN "responsibilities" TEXT;
ALTER TABLE "Experience" ADD COLUMN "revenue" TEXT;
ALTER TABLE "Experience" ADD COLUMN "sector" TEXT;
ALTER TABLE "Experience" ADD COLUMN "teamSize" TEXT;
ALTER TABLE "Experience" ADD COLUMN "tools" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "constraints" TEXT;
ALTER TABLE "Profile" ADD COLUMN "preferredTone" TEXT;
ALTER TABLE "Profile" ADD COLUMN "remotePreference" TEXT;
ALTER TABLE "Profile" ADD COLUMN "targetSalary" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CVMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "parsedJson" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'text',
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'importé',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CVMaster_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CVMaster" ("fileName", "fileSize", "fileType", "id", "originalText", "parsedJson", "profileId", "uploadedAt") SELECT "fileName", "fileSize", "fileType", "id", "originalText", "parsedJson", "profileId", "uploadedAt" FROM "CVMaster";
DROP TABLE "CVMaster";
ALTER TABLE "new_CVMaster" RENAME TO "CVMaster";
CREATE UNIQUE INDEX "CVMaster_profileId_key" ON "CVMaster"("profileId");
CREATE TABLE "new_ProofEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "experienceId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "period" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'moyen',
    "verifiable" BOOLEAN NOT NULL DEFAULT false,
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "usableForCV" BOOLEAN NOT NULL DEFAULT true,
    "usableForLetter" BOOLEAN NOT NULL DEFAULT true,
    "sendableToAI" BOOLEAN NOT NULL DEFAULT true,
    "documentUrl" TEXT,
    "linkedSkills" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProofEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProofEntry_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProofEntry" ("category", "context", "createdAt", "documentUrl", "id", "linkedSkills", "period", "profileId", "title", "value", "verifiable") SELECT "category", "context", "createdAt", "documentUrl", "id", "linkedSkills", "period", "profileId", "title", "value", "verifiable" FROM "ProofEntry";
DROP TABLE "ProofEntry";
ALTER TABLE "new_ProofEntry" RENAME TO "ProofEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
