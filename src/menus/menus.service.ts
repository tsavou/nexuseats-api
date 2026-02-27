import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByRestaurant(restaurantId: string) {
    await this.ensureActiveRestaurant(restaurantId);

    return this.prisma.menu.findMany({
      where: {
        restaurantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          include: {
            categories: true,
          },
        },
      },
    });
  }

  async create(restaurantId: string, dto: CreateMenuDto) {
    await this.ensureActiveRestaurant(restaurantId);

    return this.prisma.menu.create({
      data: {
        name: dto.name,
        description: dto.description,
        restaurantId,
      },
    });
  }

  async update(restaurantId: string, menuId: string, dto: UpdateMenuDto) {
    await this.ensureActiveMenu(restaurantId, menuId);

    return this.prisma.menu.update({
      where: { id: menuId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async softDelete(restaurantId: string, menuId: string) {
    await this.ensureActiveMenu(restaurantId, menuId);

    await this.prisma.$transaction([
      this.prisma.menu.update({
        where: { id: menuId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.menuItem.updateMany({
        where: { menuId, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  private async ensureActiveRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} introuvable`);
    }
  }

  private async ensureActiveMenu(restaurantId: string, menuId: string) {
    await this.ensureActiveRestaurant(restaurantId);

    const menu = await this.prisma.menu.findFirst({
      where: {
        id: menuId,
        restaurantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu ${menuId} introuvable`);
    }
  }
}
