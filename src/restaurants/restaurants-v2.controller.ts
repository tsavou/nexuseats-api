import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Version,
  UseGuards,
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
import { RestaurantV2ResponseDto } from './dto/restaurant-v2-response.dto';
import { PaginatedRestaurantV2ResponseDto } from './dto/paginated-restaurant-v2-response.dto';
import { FindRestaurantsQueryDto } from './dto/find-restaurants-query.dto';
import { ScrollRestaurantsQueryDto } from './dto/scroll-restaurants-query.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  // GET /restaurants?page=1&limit=20
  // ─────────────────────────────────────────────
  @Version('2')
  @Get()
  @ApiOperation({
    summary: 'Liste paginée des restaurants',
    description:
      'Retourne la liste de tous les restaurants partenaires NexusEats, ' +
      'avec pagination. Par défaut : page 1, 20 résultats par page.',
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
    description: "Nombre d'éléments par page (défaut : 20, max : 100)",
    example: 20,
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
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description:
      'Liste des champs à retourner, séparés par des virgules. Exemple: id,name,cuisine,rating',
    example: 'id,name,cuisine,rating',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée retournée avec succès',
    type: PaginatedRestaurantV2ResponseDto,
  })
  async findAll(@Query() query: FindRestaurantsQueryDto) {
    const result = await this.restaurantsService.findAll(query) as any;
    return {
      ...result,
      data: (result.data ?? []).map((r: any) => this.restaurantsService.toV2Response(r)),
    };
  }

  // ─────────────────────────────────────────────
  // GET /restaurants/:id
  // ─────────────────────────────────────────────

  @Version('2')
  @Get('scroll')
  @ApiOperation({
    summary: 'Scroll cursor des restaurants',
    description:
      'Retourne le prochain lot de restaurants avec une pagination cursor basée sur l’ID.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'UUID du dernier restaurant reçu',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments retournés (défaut : 20, max : 100)",
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lot cursor retourné avec succès',
    schema: {
      example: {
        data: [],
        meta: {
          nextCursor: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          hasNext: true,
        },
      },
    },
  })
  findAllCursor(@Query() query: ScrollRestaurantsQueryDto) {
    return this.restaurantsService.findAllCursor(query);
  }

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
    description: 'Restaurant trouvé (format v2 enrichi avec location + coordinates)',
    type: RestaurantV2ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide (format incorrect)',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 404,
          message: 'Restaurant avec l\'ID "xxx" introuvable',
          error: 'Not Found',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/v2/restaurants/xxx',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const restaurant = await this.restaurantsService.findOne(id) as any;
    return this.restaurantsService.toV2Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // POST /restaurants → 201 Created
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('owner', 'admin')
  @Version('2')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau restaurant',
    description:
      'Ajoute un restaurant partenaire à la plateforme NexusEats. ' +
      'Vérifie les doublons (même nom + même adresse). ' +
      'Nécessite le rôle **owner** ou **admin**.',
  })
  @ApiBody({ type: CreateRestaurantV2Dto })
  @ApiResponse({
    status: 201,
    description: 'Restaurant créé avec succès',
    type: RestaurantV2ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (validation échouée)',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: [
            'Le nom doit faire au moins 2 caractères',
            'La note maximale est 5',
          ],
          error: 'Bad Request',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/v2/restaurants',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé (Token JWT manquant ou invalide)',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé (rôle insuffisant — owner ou admin requis)',
  })
  @ApiResponse({
    status: 409,
    description: 'Restaurant déjà existant (même nom + même adresse)',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 409,
          message: 'Un restaurant avec ce nom et cette adresse existe déjà',
          error: 'Conflict',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/v2/restaurants',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  async create(@Body() dto: CreateRestaurantV2Dto, @CurrentUser() user: any) {
    const data: Prisma.RestaurantUncheckedCreateInput = {
      name: dto.name,
      street: dto.location.address.street,
      city: dto.location.address.city,
      zipCode: dto.location.address.zipCode,
      country: dto.location.address.country,
      latitude: dto.location.coordinates.lat,
      longitude: dto.location.coordinates.lng,
      deliveryRadius: dto.deliveryRadius,
      cuisineType: dto.cuisine,
      rating: dto.rating ?? 0,
      averagePrice: dto.averagePrice,
      phoneNumber: `${dto.countryCode} ${dto.localNumber}`,
      description: dto.description,
      ownerId: user.id,
    };

    const restaurant = await this.restaurantsService.create(data);
    return this.restaurantsService.toV2Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // PATCH /restaurants/:id → 200 OK
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles('owner', 'admin')
  @Version('2')
  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier partiellement un restaurant',
    description:
      "Met à jour les champs fournis d'un restaurant existant. " +
      'Tous les champs sont optionnels (PATCH). ' +
      "Seul le propriétaire du restaurant ou un admin peut modifier. Vérifié via l'OwnershipGuard.",
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
    type: RestaurantV2ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou UUID mal formé',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé (Token JWT manquant ou invalide)',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé (pas propriétaire du restaurant ou rôle insuffisant)',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantV2Dto,
  ) {
    const data: Prisma.RestaurantUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;

    if (dto.location) {
      if (dto.location.address) {
        data.street = dto.location.address.street;
        data.city = dto.location.address.city;
        data.zipCode = dto.location.address.zipCode;
        data.country = dto.location.address.country;
      }
      if (dto.location.coordinates) {
        data.latitude = dto.location.coordinates.lat;
        data.longitude = dto.location.coordinates.lng;
      }
    }
    if (dto.deliveryRadius !== undefined) data.deliveryRadius = dto.deliveryRadius;
    if (dto.cuisine !== undefined) data.cuisineType = dto.cuisine;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.averagePrice !== undefined) data.averagePrice = dto.averagePrice;
    if (dto.countryCode !== undefined || dto.localNumber !== undefined) {
      const code = dto.countryCode ?? '';
      const num = dto.localNumber ?? '';
      data.phoneNumber = `${code} ${num}`.trim();
    }
    if (dto.description !== undefined) data.description = dto.description;

    const restaurant = await this.restaurantsService.update(id, data);
    return this.restaurantsService.toV2Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // DELETE /restaurants/:id → 204 No Content
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Version('2')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un restaurant (soft delete)',
    description:
      'Masque le restaurant via deletedAt sans suppression physique. ' +
      'Réservé aux administrateurs uniquement.',
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
    status: 400,
    description: 'UUID invalide (format incorrect)',
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé (Token JWT manquant ou invalide)',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé (rôle admin requis)',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.softDelete(id);
  }
}
