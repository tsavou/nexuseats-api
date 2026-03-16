import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, ParseUUIDPipe,
  Version, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { Prisma } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantV2Dto } from './dto/create-restaurant-v2.dto';
import { UpdateRestaurantV2Dto } from './dto/update-restaurant-v2.dto';
import { Restaurant } from './entities/restaurant.entity';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Controller Restaurants — routes HTTP du CRUD.
 *
 * @ApiTags regroupe tous les endpoints sous "restaurants" dans Swagger.
 * Chaque méthode est documentée avec :
 * - @ApiOperation : summary (titre court) + description
 * - @ApiResponse : un par code HTTP possible (200, 201, 400, 404, 409)
 * - @ApiParam / @ApiQuery / @ApiBody : documentation des paramètres
 */
@Controller({ path: 'restaurants', version: '2' })
@ApiTags('restaurants-v2')
export class RestaurantsV2Controller {

  // Injection du service via le constructeur (DI)
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ─────────────────────────────────────────────
  // GET /restaurants?page=1&limit=10
  // ─────────────────────────────────────────────
  @Version('2')
  @Get()
  @ApiOperation({
    summary: 'Liste paginée des restaurants',
    description:
      'Retourne la liste de tous les restaurants partenaires NexusEats, ' +
      'avec pagination. Par défaut : page 1, 10 résultats par page.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut : 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut : 10, max : 100)",
    example: 10,
 })
 @ApiQuery({
    name: 'cuisineType',
    required: false,
    type: String,
    description: 'Filtre type de cuisine',
    example: 'ITALIENNE',
 })
 @ApiQuery({
    name: 'ratingMin',
    required: false,
    type: Number,
    description: 'Filtre note minimale',
    example: 4,
 })
 @ApiQuery({
    name: 'isOpen',
    required: false,
    type: Boolean,
    description: "Filtre statut d'ouverture",
    example: true,
 })
 @ApiResponse({
    status: 200,
    description: 'Liste paginée retournée avec succès',
    schema: {
      example: {
        data: [
          {
            id: 'a1b2c3d4-...',
            name: 'La Bella Italia',
            address: '12 rue de la Paix, 75002 Paris',
            cuisineType: 'ITALIENNE',
            rating: 4.2,
            averagePrice: 25,
            countryCode: '+33',
            localNumber: '612345678',
            description: 'Restaurant italien authentique au coeur de Paris',
            isOpen: true,
            createdAt: '2026-02-27T13:00:00.000Z',
            updatedAt: '2026-02-27T13:00:00.000Z',
          },
        ],
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          lastPage: 1,
          hasNext: false,
        },
      },
    },
  })
  findAll(@Query() query: FindRestaurantsQueryDto) {
    return this.restaurantsService.findAll(query);
  }

  // ─────────────────────────────────────────────
  // GET /restaurants/:id
  // ─────────────────────────────────────────────

  @Version('2')
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un restaurant par ID',
    description: "Retourne les détails complets d'un restaurant spécifique.",
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant trouvé',
    type: Restaurant,
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
    schema: {
      example: {
        statusCode: 404,
        message: 'Restaurant avec l\'ID "xxx" introuvable',
        error: 'Not Found',
      },
    },
 })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // ParseUUIDPipe valide que l'ID est un UUID valide
    // Si invalide → 400 Bad Request automatiquement
    return this.restaurantsService.findOne(id);
  }

  // ─────────────────────────────────────────────
  // POST /restaurants → 201 Created
  // ─────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('owner', 'admin')
  @Version('2')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau restaurant',
    description:
      'Ajoute un restaurant partenaire à la plateforme NexusEats. ' +
      'Vérifie les doublons (même nom + même adresse).',
 })
  @ApiBody({ type: CreateRestaurantV2Dto })
  @ApiResponse({
    status: 201,
    description: 'Restaurant créé avec succès',
    type: Restaurant,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (validation échouée)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Le nom doit faire au moins 2 caractères',
          'La note maximale est 5',
        ],
        error: 'Bad Request',
      },
  },
 })
  @ApiResponse({
    status: 409,
    description: 'Restaurant déjà existant (même nom + même adresse)',
    schema: {
      example: {
        statusCode: 409,
        message: 'Un restaurant avec ce nom et cette adresse existe déjà',
        error: 'Conflict',
      },
    },
  })
  create(@Body() dto: CreateRestaurantV2Dto, @CurrentUser() user: any) {
    const data: Prisma.RestaurantUncheckedCreateInput = {
      name: dto.name,
      address: dto.address,
      cuisineType: dto.cuisineType,
      rating: dto.rating ?? 0,
      averagePrice: dto.averagePrice,
      countryCode: dto.countryCode,
      localNumber: dto.localNumber,
      description: dto.description,
      ownerId: user.id,
    };

    return this.restaurantsService.create(data);
  }

  // ─────────────────────────────────────────────
  // PATCH /restaurants/:id → 200 OK
  // ─────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles('owner', 'admin')
  @Version('2')
  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier partiellement un restaurant',
    description:
      "Met à jour les champs fournis d'un restaurant existant. " +
      'Tous les champs sont optionnels (PATCH).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant à modifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateRestaurantV2Dto,
    description: 'Champs à modifier (tous optionnels)',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant mis à jour',
    type: Restaurant,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantV2Dto,
  ) {
    const data: Prisma.RestaurantUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.cuisineType !== undefined) data.cuisineType = dto.cuisineType;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.averagePrice !== undefined) data.averagePrice = dto.averagePrice;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.localNumber !== undefined) data.localNumber = dto.localNumber;
    if (dto.description !== undefined) data.description = dto.description;

    return this.restaurantsService.update(id, data);
  }

  // ─────────────────────────────────────────────
  // DELETE /restaurants/:id → 204 No Content
  // ─────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Version('2')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un restaurant (soft delete)',
    description: 'Masque le restaurant via deletedAt sans suppression physique.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant à supprimer',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Restaurant soft-deleted avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.softDelete(id);
  }
}
