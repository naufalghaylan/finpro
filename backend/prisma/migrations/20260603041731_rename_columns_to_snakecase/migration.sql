/*
  Warnings:

  - You are about to drop the column `createdAt` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `cartId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `maxDiscount` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `minPurchase` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `referral_usages` table. All the data in the column will be lost.
  - You are about to drop the column `referralCodeId` on the `referral_usages` table. All the data in the column will be lost.
  - You are about to drop the column `usedByUserId` on the `referral_usages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `quantityAfter` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `quantityBefore` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `quantityChange` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `stockId` on the `stock_journals` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `destinationStoreId` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `requestedBy` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `sourceStoreId` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `stock_mutations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `cityId` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `provinceId` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `serviceRadius` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `cityId` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `provinceId` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `recipientName` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `authProvider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `authProviderId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `applicableTo` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `expiredAt` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `maxDiscount` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `minPurchase` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `vouchers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cart_id,product_id]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `carts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `referral_codes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[used_by_user_id]` on the table `referral_usages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[product_id,store_id]` on the table `stocks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `image_url` to the `banners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `banners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cart_id` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `carts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `carts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_type` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_value` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_url` to the `product_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `product_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base_price` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `referral_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `referral_codes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referral_code_id` to the `referral_usages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `used_by_user_id` to the `referral_usages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `stock_journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_after` to the `stock_journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_before` to the `stock_journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_change` to the `stock_journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_id` to the `stock_journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_store_id` to the `stock_mutations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `stock_mutations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requested_by` to the `stock_mutations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_store_id` to the `stock_mutations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `stock_mutations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_name` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_type` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_value` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expired_at` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cartId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_storeId_fkey";

-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_userId_fkey";

-- DropForeignKey
ALTER TABLE "discounts" DROP CONSTRAINT "discounts_productId_fkey";

-- DropForeignKey
ALTER TABLE "discounts" DROP CONSTRAINT "discounts_storeId_fkey";

-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "referral_codes" DROP CONSTRAINT "referral_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "referral_usages" DROP CONSTRAINT "referral_usages_referralCodeId_fkey";

-- DropForeignKey
ALTER TABLE "referral_usages" DROP CONSTRAINT "referral_usages_usedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "stock_journals" DROP CONSTRAINT "stock_journals_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_journals" DROP CONSTRAINT "stock_journals_orderId_fkey";

-- DropForeignKey
ALTER TABLE "stock_journals" DROP CONSTRAINT "stock_journals_stockId_fkey";

-- DropForeignKey
ALTER TABLE "stock_mutations" DROP CONSTRAINT "stock_mutations_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_mutations" DROP CONSTRAINT "stock_mutations_destinationStoreId_fkey";

-- DropForeignKey
ALTER TABLE "stock_mutations" DROP CONSTRAINT "stock_mutations_productId_fkey";

-- DropForeignKey
ALTER TABLE "stock_mutations" DROP CONSTRAINT "stock_mutations_requestedBy_fkey";

-- DropForeignKey
ALTER TABLE "stock_mutations" DROP CONSTRAINT "stock_mutations_sourceStoreId_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_productId_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_storeId_fkey";

-- DropForeignKey
ALTER TABLE "user_addresses" DROP CONSTRAINT "user_addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_storeId_fkey";

-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_productId_fkey";

-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_userId_fkey";

-- DropIndex
DROP INDEX "cart_items_cartId_idx";

-- DropIndex
DROP INDEX "cart_items_cartId_productId_key";

-- DropIndex
DROP INDEX "cart_items_productId_idx";

-- DropIndex
DROP INDEX "carts_userId_key";

-- DropIndex
DROP INDEX "discounts_productId_idx";

-- DropIndex
DROP INDEX "discounts_storeId_idx";

-- DropIndex
DROP INDEX "product_images_productId_idx";

-- DropIndex
DROP INDEX "products_categoryId_idx";

-- DropIndex
DROP INDEX "referral_codes_userId_key";

-- DropIndex
DROP INDEX "referral_usages_referralCodeId_idx";

-- DropIndex
DROP INDEX "referral_usages_usedByUserId_key";

-- DropIndex
DROP INDEX "refresh_tokens_userId_idx";

-- DropIndex
DROP INDEX "stock_journals_createdAt_idx";

-- DropIndex
DROP INDEX "stock_journals_orderId_idx";

-- DropIndex
DROP INDEX "stock_journals_stockId_idx";

-- DropIndex
DROP INDEX "stock_mutations_destinationStoreId_idx";

-- DropIndex
DROP INDEX "stock_mutations_productId_idx";

-- DropIndex
DROP INDEX "stock_mutations_sourceStoreId_idx";

-- DropIndex
DROP INDEX "stocks_productId_storeId_key";

-- DropIndex
DROP INDEX "stocks_storeId_idx";

-- DropIndex
DROP INDEX "user_addresses_userId_idx";

-- DropIndex
DROP INDEX "vouchers_userId_idx";

-- AlterTable
ALTER TABLE "banners" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "banners" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "banners" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "banners" RENAME COLUMN "linkUrl" TO "link_url";
ALTER TABLE "banners" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "banners" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "cart_items" RENAME COLUMN "cartId" TO "cart_id";
ALTER TABLE "cart_items" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "cart_items" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "cart_items" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "carts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "carts" RENAME COLUMN "storeId" TO "store_id";
ALTER TABLE "carts" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "carts" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "categories" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "categories" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "discounts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "discounts" RENAME COLUMN "discountType" TO "discount_type";
ALTER TABLE "discounts" RENAME COLUMN "discountValue" TO "discount_value";
ALTER TABLE "discounts" RENAME COLUMN "endDate" TO "end_date";
ALTER TABLE "discounts" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "discounts" RENAME COLUMN "maxDiscount" TO "max_discount";
ALTER TABLE "discounts" RENAME COLUMN "minPurchase" TO "min_purchase";
ALTER TABLE "discounts" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "discounts" RENAME COLUMN "startDate" TO "start_date";
ALTER TABLE "discounts" RENAME COLUMN "storeId" TO "store_id";
ALTER TABLE "discounts" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "product_images" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "product_images" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "product_images" RENAME COLUMN "isPrimary" TO "is_primary";
ALTER TABLE "product_images" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "product_images" RENAME COLUMN "sortOrder" TO "sort_order";

-- AlterTable
ALTER TABLE "products" RENAME COLUMN "basePrice" TO "base_price";
ALTER TABLE "products" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "products" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "products" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "referral_codes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "referral_codes" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "referral_codes" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "referral_usages" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "referral_usages" RENAME COLUMN "referralCodeId" TO "referral_code_id";
ALTER TABLE "referral_usages" RENAME COLUMN "usedByUserId" TO "used_by_user_id";

-- AlterTable
ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "stock_journals" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "stock_journals" RENAME COLUMN "createdBy" TO "created_by";
ALTER TABLE "stock_journals" RENAME COLUMN "orderId" TO "order_id";
ALTER TABLE "stock_journals" RENAME COLUMN "quantityAfter" TO "quantity_after";
ALTER TABLE "stock_journals" RENAME COLUMN "quantityBefore" TO "quantity_before";
ALTER TABLE "stock_journals" RENAME COLUMN "quantityChange" TO "quantity_change";
ALTER TABLE "stock_journals" RENAME COLUMN "stockId" TO "stock_id";

-- AlterTable
ALTER TABLE "stock_mutations" RENAME COLUMN "approvedBy" TO "approved_by";
ALTER TABLE "stock_mutations" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "stock_mutations" RENAME COLUMN "destinationStoreId" TO "destination_store_id";
ALTER TABLE "stock_mutations" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "stock_mutations" RENAME COLUMN "requestedBy" TO "requested_by";
ALTER TABLE "stock_mutations" RENAME COLUMN "sourceStoreId" TO "source_store_id";
ALTER TABLE "stock_mutations" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "stocks" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "stocks" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "stocks" RENAME COLUMN "storeId" TO "store_id";
ALTER TABLE "stocks" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "stores" RENAME COLUMN "cityId" TO "city_id";
ALTER TABLE "stores" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "stores" RENAME COLUMN "postalCode" TO "postal_code";
ALTER TABLE "stores" RENAME COLUMN "provinceId" TO "province_id";
ALTER TABLE "stores" RENAME COLUMN "serviceRadius" TO "service_radius";
ALTER TABLE "stores" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "user_addresses" RENAME COLUMN "cityId" TO "city_id";
ALTER TABLE "user_addresses" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user_addresses" RENAME COLUMN "isPrimary" TO "is_primary";
ALTER TABLE "user_addresses" RENAME COLUMN "postalCode" TO "postal_code";
ALTER TABLE "user_addresses" RENAME COLUMN "provinceId" TO "province_id";
ALTER TABLE "user_addresses" RENAME COLUMN "recipientName" TO "recipient_name";
ALTER TABLE "user_addresses" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "user_addresses" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "authProvider" TO "auth_provider";
ALTER TABLE "users" RENAME COLUMN "authProviderId" TO "auth_provider_id";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
ALTER TABLE "users" RENAME COLUMN "profilePicture" TO "profile_picture";
ALTER TABLE "users" RENAME COLUMN "storeId" TO "store_id";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- AlterTable
ALTER TABLE "vouchers" RENAME COLUMN "applicableTo" TO "applicable_to";
ALTER TABLE "vouchers" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "vouchers" RENAME COLUMN "discountType" TO "discount_type";
ALTER TABLE "vouchers" RENAME COLUMN "discountValue" TO "discount_value";
ALTER TABLE "vouchers" RENAME COLUMN "expiredAt" TO "expired_at";
ALTER TABLE "vouchers" RENAME COLUMN "maxDiscount" TO "max_discount";
ALTER TABLE "vouchers" RENAME COLUMN "minPurchase" TO "min_purchase";
ALTER TABLE "vouchers" RENAME COLUMN "productId" TO "product_id";
ALTER TABLE "vouchers" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "vouchers" RENAME COLUMN "usedAt" TO "used_at";
ALTER TABLE "vouchers" RENAME COLUMN "userId" TO "user_id";

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "discounts_store_id_idx" ON "discounts"("store_id");

-- CreateIndex
CREATE INDEX "discounts_product_id_idx" ON "discounts"("product_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_user_id_key" ON "referral_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_usages_used_by_user_id_key" ON "referral_usages"("used_by_user_id");

-- CreateIndex
CREATE INDEX "referral_usages_referral_code_id_idx" ON "referral_usages"("referral_code_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "stock_journals_stock_id_idx" ON "stock_journals"("stock_id");

-- CreateIndex
CREATE INDEX "stock_journals_order_id_idx" ON "stock_journals"("order_id");

-- CreateIndex
CREATE INDEX "stock_journals_created_at_idx" ON "stock_journals"("created_at");

-- CreateIndex
CREATE INDEX "stock_mutations_source_store_id_idx" ON "stock_mutations"("source_store_id");

-- CreateIndex
CREATE INDEX "stock_mutations_destination_store_id_idx" ON "stock_mutations"("destination_store_id");

-- CreateIndex
CREATE INDEX "stock_mutations_product_id_idx" ON "stock_mutations"("product_id");

-- CreateIndex
CREATE INDEX "stocks_store_id_idx" ON "stocks"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_id_store_id_key" ON "stocks"("product_id", "store_id");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "vouchers_user_id_idx" ON "vouchers"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_journals" ADD CONSTRAINT "stock_journals_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_journals" ADD CONSTRAINT "stock_journals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_journals" ADD CONSTRAINT "stock_journals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_source_store_id_fkey" FOREIGN KEY ("source_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_destination_store_id_fkey" FOREIGN KEY ("destination_store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_used_by_user_id_fkey" FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
