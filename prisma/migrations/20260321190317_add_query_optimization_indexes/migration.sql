-- DropIndex
DROP INDEX "idx_restaurants_rating";

-- CreateIndex
CREATE INDEX "idx_menu_items_price" ON "menu_items"("price");

-- CreateIndex
CREATE INDEX "idx_restaurants_rating" ON "restaurants"("rating" DESC);

-- CreateIndex
CREATE INDEX "idx_restaurants_name" ON "restaurants"("name");

-- CreateIndex
CREATE INDEX "idx_restaurants_deleted_created_at" ON "restaurants"("deleted_at", "created_at" DESC);
