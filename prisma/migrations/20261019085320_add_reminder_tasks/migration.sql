-- CreateTable
CREATE TABLE "ReminderTask" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "remindOn" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderTask_pkey" PRIMARY KEY ("id")
);
