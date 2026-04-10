/*
  Warnings:

  - You are about to drop the column `country_code` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `local_number` on the `restaurants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "country_code",
DROP COLUMN "local_number";
