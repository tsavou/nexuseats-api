-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "deleted_at" TIMESTAMP(3);
