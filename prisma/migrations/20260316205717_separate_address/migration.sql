/*
  Warnings:

  - You are about to drop the column `address` on the `restaurants` table. All the data in the column will be lost.
  - Added the required column `city` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "address",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "zip_code" TEXT NOT NULL;
