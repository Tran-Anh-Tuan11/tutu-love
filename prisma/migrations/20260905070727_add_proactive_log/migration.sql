-- CreateTable
CREATE TABLE "ProactiveLog" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProactiveLog_pkey" PRIMARY KEY ("id")
);
