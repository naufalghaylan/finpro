-- CreateTable
CREATE TABLE "user_shipping_caches" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "courier" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_shipping_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_shipping_caches_user_id_idx" ON "user_shipping_caches"("user_id");

-- CreateIndex
CREATE INDEX "user_shipping_caches_address_id_idx" ON "user_shipping_caches"("address_id");

-- CreateIndex
CREATE INDEX "user_shipping_caches_store_id_idx" ON "user_shipping_caches"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_shipping_caches_user_id_address_id_store_id_weight_cou_key" ON "user_shipping_caches"("user_id", "address_id", "store_id", "weight", "courier");

-- AddForeignKey
ALTER TABLE "user_shipping_caches" ADD CONSTRAINT "user_shipping_caches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shipping_caches" ADD CONSTRAINT "user_shipping_caches_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "user_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shipping_caches" ADD CONSTRAINT "user_shipping_caches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
