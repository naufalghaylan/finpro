/*
  Warnings:

  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provinces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cities" DROP CONSTRAINT "cities_province_id_fkey";

-- DropTable
DROP TABLE "cities";

-- DropTable
DROP TABLE "provinces";
