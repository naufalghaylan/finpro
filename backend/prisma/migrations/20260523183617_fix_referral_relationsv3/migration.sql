/*
  Warnings:

  - You are about to drop the column `usedBy` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `referralCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referredBy` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `referral_codes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referredBy_fkey";

-- DropIndex
DROP INDEX "referral_codes_userId_idx";

-- DropIndex
DROP INDEX "users_referralCode_key";

-- AlterTable
ALTER TABLE "referral_codes" DROP COLUMN "usedBy";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "referralCode",
DROP COLUMN "referredBy",
ADD COLUMN     "authProvider" TEXT DEFAULT 'CREDENTIALS',
ADD COLUMN     "authProviderId" TEXT;

-- CreateTable
CREATE TABLE "referral_usages" (
    "id" SERIAL NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "usedByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_password_tokens" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reset_password_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_usages_usedByUserId_key" ON "referral_usages"("usedByUserId");

-- CreateIndex
CREATE INDEX "referral_usages_referralCodeId_idx" ON "referral_usages"("referralCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_token_key" ON "verification_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "reset_password_tokens_token_key" ON "reset_password_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "reset_password_tokens_email_token_key" ON "reset_password_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
