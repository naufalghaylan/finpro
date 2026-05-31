/*
  Warnings:

  - You are about to drop the column `authProvider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `authProviderId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referredByCodeId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `banners` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reset_password_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referralCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "referral_codes" DROP CONSTRAINT "referral_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referredByCodeId_fkey";

-- DropIndex
DROP INDEX "referral_codes_userId_key";

-- AlterTable
ALTER TABLE "referral_codes" ADD COLUMN     "usedBy" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "authProvider",
DROP COLUMN "authProviderId",
DROP COLUMN "referredByCodeId",
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredBy" INTEGER;

-- DropTable
DROP TABLE "banners";

-- DropTable
DROP TABLE "reset_password_tokens";

-- DropTable
DROP TABLE "verification_tokens";

-- CreateIndex
CREATE INDEX "referral_codes_userId_idx" ON "referral_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
