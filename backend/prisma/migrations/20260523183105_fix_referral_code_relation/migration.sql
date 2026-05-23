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
ADD COLUMN     "referredByCodeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByCodeId_fkey" FOREIGN KEY ("referredByCodeId") REFERENCES "referral_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
