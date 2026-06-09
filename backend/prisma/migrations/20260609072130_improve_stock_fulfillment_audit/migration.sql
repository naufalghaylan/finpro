-- AlterTable
ALTER TABLE "stock_journals" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "product_snapshot" JSONB,
ADD COLUMN     "stock_mutation_id" INTEGER,
ADD COLUMN     "store_snapshot" JSONB;

-- AlterTable
ALTER TABLE "stock_mutations" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "order_id" INTEGER,
ADD COLUMN     "received_at" TIMESTAMP(3),
ADD COLUMN     "received_by" INTEGER,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "stock_journals_stock_mutation_id_idx" ON "stock_journals"("stock_mutation_id");

-- CreateIndex
CREATE INDEX "stock_mutations_order_id_idx" ON "stock_mutations"("order_id");

-- CreateIndex
CREATE INDEX "stock_mutations_status_idx" ON "stock_mutations"("status");

-- AddForeignKey
ALTER TABLE "stock_journals" ADD CONSTRAINT "stock_journals_stock_mutation_id_fkey" FOREIGN KEY ("stock_mutation_id") REFERENCES "stock_mutations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_mutations" ADD CONSTRAINT "stock_mutations_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
