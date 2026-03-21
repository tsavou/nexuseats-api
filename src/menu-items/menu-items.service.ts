import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemCategoriesDto } from './dto/update-menu-item-categories.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByMenu(menuId: string) {
    await this.ensureActiveMenu(menuId);

    return this.prisma.menuItem.findMany({
      where: {
        menuId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      include: {
        categories: true,
      },
    });
  }

  async create(menuId: string, dto: CreateMenuItemDto) {
    await this.ensureActiveMenu(menuId);

    if (dto.categoryIds?.length) {
      await this.ensureCategoriesExist(dto.categoryIds);
    }

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        price: dto.price,
        available: dto.available ?? true,
        menuId,
        categories: dto.categoryIds?.length
          ? {
              connect: dto.categoryIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { categories: true },
    });
  }

  async update(menuId: string, itemId: string, dto: UpdateMenuItemDto) {
    await this.ensureActiveMenuItem(menuId, itemId);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        price: dto.price,
        available: dto.available,
      },
      include: { categories: true },
    });
  }

  async softDelete(menuId: string, itemId: string) {
    await this.ensureActiveMenuItem(menuId, itemId);

    await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
  }

  async updateCategories(
    menuId: string,
    itemId: string,
    dto: UpdateMenuItemCategoriesDto,
  ) {
    await this.ensureActiveMenuItem(menuId, itemId);

    const connectIds = dto.connectIds ?? [];
    const disconnectIds = dto.disconnectIds ?? [];
    if (connectIds.length === 0 && disconnectIds.length === 0) {
      throw new BadRequestException(
        'Au moins un tableau connectIds ou disconnectIds doit être fourni',
      );
    }

    await this.ensureCategoriesExist([...connectIds, ...disconnectIds]);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        categories: {
          connect: connectIds.map((id) => ({ id })),
          disconnect: disconnectIds.map((id) => ({ id })),
        },
      },
      include: { categories: true },
    });
  }

  private async ensureActiveMenu(menuId: string) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        id: menuId,
        deletedAt: null,
        restaurant: {
          deletedAt: null,
        },
      },
      select: { id: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu ${menuId} introuvable`);
    }
  }

  private async ensureActiveMenuItem(menuId: string, itemId: string) {
    await this.ensureActiveMenu(menuId);

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        menuId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException(`Menu item ${itemId} introuvable`);
    }
  }

  private async ensureCategoriesExist(categoryIds: string[]) {
    const uniqueIds = [...new Set(categoryIds)];
    if (uniqueIds.length === 0) {
      return;
    }

    const count = await this.prisma.category.count({
      where: {
        id: { in: uniqueIds },
      },
    });

    if (count !== uniqueIds.length) {
      throw new NotFoundException(
        'Une ou plusieurs catégories sont introuvables',
      );
    }
  }
}
