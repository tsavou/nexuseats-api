import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Version,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemCategoriesDto } from './dto/update-menu-item-categories.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuItemsService } from './menu-items.service';

@Controller({ path: 'menus/:menuId/items', version: '2' })
@ApiTags('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Version('2')
  @Get()
  @ApiOperation({
    summary: "Lister les items d'un menu",
    description:
      "Retourne les items actifs (non soft-deleted) d'un menu avec leurs catégories.",
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des items récupérée avec succès',
    type: MenuItemEntity,
    isArray: true,
    schema: {
      example: [
        {
          id: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
          name: 'Pizza Margherita',
          price: '12.50',
          available: true,
          menuId: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
          categories: [
            { id: '9ec7f32f-f6e8-4091-a822-741fba76d92b', name: 'Pizza' },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Menu introuvable',
  })
  findAllByMenu(@Param('menuId', ParseUUIDPipe) menuId: string) {
    return this.menuItemsService.findAllByMenu(menuId);
  }

  @Version('2')
  @Post()
  @ApiOperation({
    summary: 'Créer un item de menu',
    description:
      "Crée un item dans un menu actif et peut connecter des catégories via categoryIds.",
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiBody({
    type: CreateMenuItemDto,
    description: "Données de l'item à créer",
  })
  @ApiResponse({
    status: 201,
    description: 'Item créé avec succès',
    type: MenuItemEntity,
    schema: {
      example: {
        id: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
        name: 'Pizza Margherita',
        price: '12.50',
        available: true,
        menuId: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
        categories: [
          { id: '9ec7f32f-f6e8-4091-a822-741fba76d92b', name: 'Pizza' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu ou catégorie introuvable',
  })
  create(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuItemsService.create(menuId, dto);
  }

  @Version('2')
  @Patch(':itemId')
  @ApiOperation({
    summary: 'Mettre à jour un item de menu',
    description: "Met à jour partiellement un item d'un menu.",
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiParam({
    name: 'itemId',
    type: String,
    description: "UUID de l'item à modifier",
    example: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
  })
  @ApiBody({
    type: UpdateMenuItemDto,
    description: "Champs de l'item à modifier (PATCH)",
  })
  @ApiResponse({
    status: 200,
    description: 'Item mis à jour',
    type: MenuItemEntity,
    schema: {
      example: {
        id: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
        name: 'Pizza Margherita XL',
        price: '14.00',
        available: true,
        menuId: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu ou item introuvable',
  })
  update(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(menuId, itemId, dto);
  }

  @Version('2')
  @Patch(':itemId/categories')
  @ApiOperation({
    summary: 'Connecter / déconnecter des catégories',
    description:
      "Met à jour les relations N:M entre un item et des catégories via connectIds / disconnectIds.",
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiParam({
    name: 'itemId',
    type: String,
    description: "UUID de l'item ciblé",
    example: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
  })
  @ApiBody({
    type: UpdateMenuItemCategoriesDto,
    description:
      'IDs de catégories à connecter et/ou déconnecter (au moins un des deux tableaux)',
  })
  @ApiResponse({
    status: 200,
    description: 'Relations catégories mises à jour',
    type: MenuItemEntity,
    schema: {
      example: {
        id: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
        name: 'Pizza Margherita',
        categories: [
          { id: '9ec7f32f-f6e8-4091-a822-741fba76d92b', name: 'Pizza' },
          { id: '57f85f4a-3926-4f42-bf3b-8bfbb7a97f6b', name: 'Vegetarien' },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide (ex: connectIds et disconnectIds absents)',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu, item ou catégorie introuvable',
  })
  updateCategories(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMenuItemCategoriesDto,
  ) {
    return this.menuItemsService.updateCategories(menuId, itemId, dto);
  }

  @Version('2')
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer (soft delete) un item de menu',
    description: "Marque l'item comme supprimé logiquement via deletedAt.",
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu parent',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiParam({
    name: 'itemId',
    type: String,
    description: "UUID de l'item à supprimer",
    example: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
  })
  @ApiResponse({
    status: 204,
    description: 'Item soft-deleted avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu ou item introuvable',
  })
  remove(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.menuItemsService.softDelete(menuId, itemId);
  }
}
