/*
  Warnings:

  - Added the required column `owner_id` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "idx_restaurants_owner_id" ON "restaurants"("owner_id");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
