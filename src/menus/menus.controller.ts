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
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuEntity } from './entities/menu.entity';
import { MenusService } from './menus.service';

@Controller({ path: 'restaurants/:restaurantId/menus', version: '2' })
@ApiTags('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Version('2')
  @Get()
  @ApiOperation({
    summary: "Lister les menus d'un restaurant",
    description:
      "Retourne les menus actifs (non soft-deleted) d'un restaurant, avec leurs items actifs et catégories.",
  })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'UUID du restaurant parent',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des menus récupérée avec succès',
    type: MenuEntity,
    isArray: true,
    schema: {
      example: [
        {
          id: 'a4fa61d2-12c2-4f1d-9d9e-2b98ba98f5f2',
          name: 'Menu Midi',
          description: 'Formule dejeuner italienne',
          restaurantId: '11111111-1111-4111-8111-111111111111',
          items: [
            {
              id: '2f7c14a4-1092-43a4-9b8d-2c72289a7f77',
              name: 'Pizza Margherita',
              price: '12.50',
              available: true,
              categories: [
                { id: '9ec7f32f-f6e8-4091-a822-741fba76d92b', name: 'Pizza' },
              ],
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  findAllByRestaurant(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.menusService.findAllByRestaurant(restaurantId);
  }

  @Version('2')
  @Post()
  @ApiOperation({
    summary: 'Créer un menu',
    description: 'Crée un nouveau menu rattaché à un restaurant actif.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'UUID du restaurant parent',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiBody({
    type: CreateMenuDto,
    description: 'Données du menu à créer',
  })
  @ApiResponse({
    status: 201,
    description: 'Menu créé avec succès',
    type: MenuEntity,
    schema: {
      example: {
        id: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
        name: 'Menu Soir',
        description: 'Selection italienne premium',
        restaurantId: '11111111-1111-4111-8111-111111111111',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  create(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateMenuDto,
  ) {
    return this.menusService.create(restaurantId, dto);
  }

  @Version('2')
  @Patch(':menuId')
  @ApiOperation({
    summary: 'Mettre à jour un menu',
    description: "Met à jour partiellement un menu d'un restaurant.",
  })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'UUID du restaurant parent',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu à modifier',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiBody({
    type: UpdateMenuDto,
    description: 'Champs du menu à modifier (PATCH)',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu mis à jour',
    type: MenuEntity,
    schema: {
      example: {
        id: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
        name: 'Menu Soir Premium',
        description: 'Selection italienne premium',
        restaurantId: '11111111-1111-4111-8111-111111111111',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant ou menu introuvable',
  })
  update(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menusService.update(restaurantId, menuId, dto);
  }

  @Version('2')
  @Delete(':menuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer (soft delete) un menu',
    description:
      'Marque le menu comme supprimé logiquement et applique une cascade soft delete sur ses items.',
  })
  @ApiParam({
    name: 'restaurantId',
    type: String,
    description: 'UUID du restaurant parent',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiParam({
    name: 'menuId',
    type: String,
    description: 'UUID du menu à supprimer',
    example: '3a94c616-2331-4d9f-a0fe-62a77f0915ff',
  })
  @ApiResponse({
    status: 204,
    description: 'Menu soft-deleted avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant ou menu introuvable',
  })
  remove(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId', ParseUUIDPipe) menuId: string,
  ) {
    return this.menusService.softDelete(restaurantId, menuId);
  }
}
