import 'dotenv/config';
import { CuisineType, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type SeedMenuItem = {
  name: string;
  price: string;
  available: boolean;
  categories: string[];
};

type SeedMenu = {
  name: string;
  description?: string;
  items: SeedMenuItem[];
};

type SeedRestaurant = {
  id: string;
  name: string;
  cuisineType: CuisineType;
  address: string;
  rating: number;
  averagePrice: number;
  phoneNumber?: string;
  countryCode?: string;
  localNumber?: string;
  description?: string;
  isOpen: boolean;
  menus: SeedMenu[];
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoryNames = [
  'Pizza',
  'Pasta',
  'Sushi',
  'Ramen',
  'Dessert',
  'Boisson',
  'Vegetarien',
  'Epice',
];

const restaurants: SeedRestaurant[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'La Bella Italia',
    cuisineType: CuisineType.ITALIENNE,
    address: '12 rue de la Paix, 75002 Paris',
    rating: 4.3,
    averagePrice: 24,
    phoneNumber: '+33 1 42 61 23 45',
    countryCode: '+33',
    localNumber: '612345678',
    description: 'Restaurant italien authentique au coeur de Paris',
    isOpen: true,
    menus: [
      {
        name: 'Menu Midi',
        description: 'Formule dejeuner italienne',
        items: [
          {
            name: 'Pizza Margherita',
            price: '12.50',
            available: true,
            categories: ['Pizza', 'Vegetarien'],
          },
          {
            name: 'Penne Arrabbiata',
            price: '11.90',
            available: true,
            categories: ['Pasta', 'Epice'],
          },
        ],
      },
      {
        name: 'Menu Soir',
        description: 'Selection italienne premium',
        items: [
          {
            name: 'Lasagnes Maison',
            price: '15.00',
            available: true,
            categories: ['Pasta'],
          },
          {
            name: 'Tiramisu',
            price: '6.50',
            available: true,
            categories: ['Dessert'],
          },
        ],
      },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Sushi Master',
    cuisineType: CuisineType.JAPONAISE,
    address: "8 avenue de l'Opera, 75001 Paris",
    rating: 4.6,
    averagePrice: 32,
    countryCode: '+33',
    localNumber: '698765432',
    description: 'Sushis frais prepares par des chefs japonais',
    isOpen: true,
    menus: [
      {
        name: 'Menu Lunch',
        description: 'Classiques japonais pour le midi',
        items: [
          {
            name: 'Sushi Saumon (8 pcs)',
            price: '14.20',
            available: true,
            categories: ['Sushi'],
          },
          {
            name: 'Ramen Miso',
            price: '13.80',
            available: true,
            categories: ['Ramen', 'Epice'],
          },
        ],
      },
      {
        name: 'Menu Signature',
        description: 'Selection du chef',
        items: [
          {
            name: 'Dragon Roll',
            price: '17.50',
            available: true,
            categories: ['Sushi'],
          },
          {
            name: 'Mochi Matcha',
            price: '5.90',
            available: true,
            categories: ['Dessert'],
          },
        ],
      },
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Le Bistrot Francais',
    cuisineType: CuisineType.FRANCAISE,
    address: '22 boulevard Saint-Germain, 75005 Paris',
    rating: 4.1,
    averagePrice: 27,
    phoneNumber: '+33 1 46 33 12 34',
    description: 'Bistrot francais traditionnel',
    isOpen: false,
    menus: [
      {
        name: 'Menu Tradition',
        description: 'Plats francais incontournables',
        items: [
          {
            name: "Boeuf Bourguignon",
            price: '18.50',
            available: true,
            categories: ['Epice'],
          },
          {
            name: 'Gratin Dauphinois',
            price: '9.90',
            available: true,
            categories: ['Vegetarien'],
          },
        ],
      },
      {
        name: 'Menu Gourmand',
        description: 'Experience bistrot complete',
        items: [
          {
            name: 'Creme Brulee',
            price: '6.80',
            available: true,
            categories: ['Dessert'],
          },
          {
            name: 'Limonade Maison',
            price: '4.50',
            available: true,
            categories: ['Boisson'],
          },
        ],
      },
    ],
  },
];

function menusCreateInput(menus: SeedMenu[]) {
  return menus.map((menu) => ({
    name: menu.name,
    description: menu.description,
    items: {
      create: menu.items.map((item) => ({
        name: item.name,
        price: item.price,
        available: item.available,
        categories: {
          connect: item.categories.map((name) => ({ name })),
        },
      })),
    },
  }));
}

async function main() {
  for (const categoryName of categoryNames) {
    await prisma.category.upsert({
      where: { name: categoryName },
      create: { name: categoryName },
      update: {},
    });
  }

  for (const restaurant of restaurants) {
    const menuData = menusCreateInput(restaurant.menus);

    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      create: {
        id: restaurant.id,
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        address: restaurant.address,
        rating: restaurant.rating,
        averagePrice: restaurant.averagePrice,
        phoneNumber: restaurant.phoneNumber,
        countryCode: restaurant.countryCode,
        localNumber: restaurant.localNumber,
        description: restaurant.description,
        isOpen: restaurant.isOpen,
        menus: { create: menuData },
      },
      update: {
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        address: restaurant.address,
        rating: restaurant.rating,
        averagePrice: restaurant.averagePrice,
        phoneNumber: restaurant.phoneNumber,
        countryCode: restaurant.countryCode,
        localNumber: restaurant.localNumber,
        description: restaurant.description,
        isOpen: restaurant.isOpen,
        deletedAt: null,
        menus: {
          deleteMany: {},
          create: menuData,
        },
      },
    });
  }

  const [restaurantCount, menuCount, menuItemCount, categoryCount] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.menu.count(),
      prisma.menuItem.count(),
      prisma.category.count(),
    ]);

  console.log(
    `Seed done - restaurants: ${restaurantCount}, menus: ${menuCount}, menuItems: ${menuItemCount}, categories: ${categoryCount}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
