-- CreateEnum
CREATE TYPE "BotMessageRole" AS ENUM ('USER', 'MODEL');

-- CreateTable
CREATE TABLE "BotConversation" (
    "id" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "BotMessageRole" NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "parts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotConversation_complexId_customerPhone_key" ON "BotConversation"("complexId", "customerPhone");

-- CreateIndex
CREATE INDEX "BotMessage_conversationId_createdAt_idx" ON "BotMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "BotConversation" ADD CONSTRAINT "BotConversation_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotMessage" ADD CONSTRAINT "BotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "BotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
