-- AlterTable
ALTER TABLE "JobSource" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "country" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "jobSourceId" TEXT,
    "rawText" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "contractType" TEXT,
    "remote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "score" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_jobSourceId_fkey" FOREIGN KEY ("jobSourceId") REFERENCES "JobSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Opportunity" ("appliedAt", "company", "contractType", "country", "createdAt", "id", "jobSourceId", "location", "rawText", "remote", "salaryCurrency", "salaryMax", "salaryMin", "score", "sourceName", "sourceUrl", "status", "title", "updatedAt") SELECT "appliedAt", "company", "contractType", "country", "createdAt", "id", "jobSourceId", "location", "rawText", "remote", "salaryCurrency", "salaryMax", "salaryMin", "score", "sourceName", "sourceUrl", "status", "title", "updatedAt" FROM "Opportunity";
DROP TABLE "Opportunity";
ALTER TABLE "new_Opportunity" RENAME TO "Opportunity";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
