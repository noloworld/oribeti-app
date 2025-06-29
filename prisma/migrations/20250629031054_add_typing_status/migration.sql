-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTyping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastTyping" TIMESTAMP(3);
