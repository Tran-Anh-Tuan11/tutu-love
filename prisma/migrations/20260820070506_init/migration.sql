-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faceDescriptor" TEXT,
    "enrolledAt" DATETIME
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "morningDone" BOOLEAN NOT NULL DEFAULT false,
    "eveningDone" BOOLEAN NOT NULL DEFAULT false,
    "morningAt" DATETIME,
    "eveningAt" DATETIME,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Streak" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" TEXT,
    "brokenAt" TEXT,
    "streakBeforeBreak" INTEGER NOT NULL DEFAULT 0,
    "repairProgress" INTEGER NOT NULL DEFAULT 0,
    "repairUnlockedAt" DATETIME,
    CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Todo_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "relationshipStart" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#f7d9de'
);

-- CreateTable
CREATE TABLE "PeriodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" TEXT NOT NULL,
    "cycleLength" INTEGER NOT NULL DEFAULT 28,
    "periodLength" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpecialDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "year" INTEGER,
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DismissedReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occasionKey" TEXT NOT NULL,
    "date" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_date_userId_key" ON "CheckIn"("date", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DismissedReminder_occasionKey_date_key" ON "DismissedReminder"("occasionKey", "date");
