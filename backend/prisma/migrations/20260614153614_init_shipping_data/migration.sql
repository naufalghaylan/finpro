-- CreateTable
CREATE TABLE "provinces" (
    "province_id" TEXT NOT NULL,
    "province" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "cities" (
    "city_id" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city_name" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("city_id")
);

-- CreateIndex
CREATE INDEX "cities_province_id_idx" ON "cities"("province_id");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE CASCADE ON UPDATE CASCADE;
