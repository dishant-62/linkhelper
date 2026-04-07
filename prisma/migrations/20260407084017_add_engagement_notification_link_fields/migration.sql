-- AlterTable
ALTER TABLE "Link" ADD COLUMN "category" TEXT;
ALTER TABLE "Link" ADD COLUMN "thumbnail" TEXT;

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Engagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Engagement_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Engagement_userId_idx" ON "Engagement"("userId");

-- CreateIndex
CREATE INDEX "Engagement_linkId_idx" ON "Engagement"("linkId");

-- CreateIndex
CREATE INDEX "Engagement_clickedAt_idx" ON "Engagement"("clickedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_linkId_idx" ON "Notification"("linkId");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE INDEX "Notification_opened_idx" ON "Notification"("opened");

-- CreateIndex
CREATE INDEX "Link_userId_idx" ON "Link"("userId");

-- CreateIndex
CREATE INDEX "Link_createdAt_idx" ON "Link"("createdAt");

-- CreateIndex
CREATE INDEX "Link_category_idx" ON "Link"("category");
