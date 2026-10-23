-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "mobileImageUrl" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "CrewApplication" ADD COLUMN     "crewAccountId" TEXT;

-- CreateTable
CREATE TABLE "CrewAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientKind" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "actorKind" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'upload',
    "url" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrewAccount_email_key" ON "CrewAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CrewAccount_phone_key" ON "CrewAccount"("phone");

-- CreateIndex
CREATE INDEX "Notification_recipientKind_recipientId_createdAt_idx" ON "Notification"("recipientKind", "recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientKind_recipientId_readAt_idx" ON "Notification"("recipientKind", "recipientId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "CrewApplication_crewAccountId_key" ON "CrewApplication"("crewAccountId");

-- AddForeignKey
ALTER TABLE "CrewApplication" ADD CONSTRAINT "CrewApplication_crewAccountId_fkey" FOREIGN KEY ("crewAccountId") REFERENCES "CrewAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
