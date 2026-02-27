-- CreateEnum
CREATE TYPE "CuisineType" AS ENUM ('FRANCAISE', 'ITALIENNE', 'JAPONAISE', 'CHINOISE', 'INDIENNE', 'MEXICAINE', 'AMERICAINE', 'THAILANDAISE', 'LIBANAISE', 'AUTRE');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" "CuisineType" NOT NULL,
    "address" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_price" DOUBLE PRECISION NOT NULL,
    "phone_number" TEXT,
    "country_code" TEXT,
    "local_number" TEXT,
    "description" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "menu_id" TEXT NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToMenuItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToMenuItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "idx_restaurants_cuisine" ON "restaurants"("cuisine");

-- CreateIndex
CREATE INDEX "idx_restaurants_rating" ON "restaurants"("rating");

-- CreateIndex
CREATE INDEX "idx_menus_restaurant_id" ON "menus"("restaurant_id");

-- CreateIndex
CREATE INDEX "idx_menu_items_menu_id" ON "menu_items"("menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "_CategoryToMenuItem_B_index" ON "_CategoryToMenuItem"("B");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMenuItem" ADD CONSTRAINT "_CategoryToMenuItem_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMenuItem" ADD CONSTRAINT "_CategoryToMenuItem_B_fkey" FOREIGN KEY ("B") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
