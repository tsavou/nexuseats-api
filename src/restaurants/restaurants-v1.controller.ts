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
  Header,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { Prisma } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant-v1.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant-v1.dto';
import { RestaurantV1ResponseDto } from './dto/restaurant-v1-response.dto';
import { PaginatedRestaurantV1ResponseDto } from './dto/paginated-restaurant-v1-response.dto';
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
@Controller({ path: 'restaurants', version: '1' })
@ApiTags('restaurants-v1')
export class RestaurantsV1Controller {
  // Injection du service via le constructeur (DI)
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ─────────────────────────────────────────────
  // GET /restaurants?page=1&limit=20
  // ─────────────────────────────────────────────
  @Version('1')
  @Get()
  @ApiOperation({
    summary: '[DEPRECATED] Liste paginée des restaurants',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants>; rel="successor-version"')
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
    type: PaginatedRestaurantV1ResponseDto,
  })
  async findAll(@Query() query: FindRestaurantsQueryDto) {
    const result = await this.restaurantsService.findAll(query) as any;
    return {
      ...result,
      data: (result.data ?? []).map((r: any) => this.restaurantsService.toV1Response(r)),
    };
  }

  // ─────────────────────────────────────────────
  // GET /restaurants/:id
  // ─────────────────────────────────────────────

  @Version('1')
  @Get('scroll')
  @ApiOperation({
    summary: '[DEPRECATED] Scroll cursor des restaurants',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants/scroll. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants/scroll>; rel="successor-version"')
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

  @Version('1')
  @Get(':id')
  @ApiOperation({
    summary: '[DEPRECATED] Récupérer un restaurant par ID',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants>; rel="successor-version"')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant trouvé (format v1)',
    type: RestaurantV1ResponseDto,
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
          path: '/api/v1/restaurants/xxx',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const restaurant = await this.restaurantsService.findOne(id) as any;
    return this.restaurantsService.toV1Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // POST /restaurants → 201 Created
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('owner', 'admin')
  @Version('1')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '[DEPRECATED] Créer un nouveau restaurant',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants>; rel="successor-version"')
  @ApiBody({ type: CreateRestaurantDto })
  @ApiResponse({
    status: 201,
    description: 'Restaurant créé avec succès',
    type: RestaurantV1ResponseDto,
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
          path: '/api/v1/restaurants',
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
    description: 'Accès refusé (rôle insuffisant)',
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
          path: '/api/v1/restaurants',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  async create(@Body() dto: CreateRestaurantDto, @CurrentUser() user: any) {
    const data: Prisma.RestaurantUncheckedCreateInput = {
      name: dto.name,
      street: dto.address.street,
      city: dto.address.city,
      zipCode: dto.address.zipCode,
      country: dto.address.country,
      cuisineType: dto.cuisine,
      rating: dto.rating ?? 0,
      averagePrice: dto.averagePrice,
      phoneNumber: dto.phone,
      description: dto.description,
      ownerId: user.id,
    };

    const restaurant = await this.restaurantsService.create(data);
    return this.restaurantsService.toV1Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // PATCH /restaurants/:id → 200 OK
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
  @Roles('owner', 'admin')
  @Version('1')
  @Patch(':id')
  @ApiOperation({
    summary: '[DEPRECATED] Modifier partiellement un restaurant',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants>; rel="successor-version"')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant à modifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateRestaurantDto,
    description: 'Champs à modifier (tous optionnels)',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant mis à jour',
    type: RestaurantV1ResponseDto,
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
    description: 'Accès refusé (pas propriétaire ou rôle insuffisant)',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    const data: Prisma.RestaurantUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;

    if (dto.address !== undefined) {
      data.street = dto.address.street;
      data.city = dto.address.city;
      data.zipCode = dto.address.zipCode;
      data.country = dto.address.country;
    }

    if (dto.cuisine !== undefined) data.cuisineType = dto.cuisine;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.averagePrice !== undefined) data.averagePrice = dto.averagePrice;
    if (dto.phone !== undefined) data.phoneNumber = dto.phone;
    if (dto.description !== undefined) data.description = dto.description;

    const restaurant = await this.restaurantsService.update(id, data);
    return this.restaurantsService.toV1Response(restaurant);
  }

  // ─────────────────────────────────────────────
  // DELETE /restaurants/:id → 204 No Content
  // ─────────────────────────────────────────────

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Version('1')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '[DEPRECATED] Supprimer un restaurant (soft delete)',
    deprecated: true,
    description:
      'DEPRECATED: Utilisez /v2/restaurants. Cette route utilise le champ global phoneNumber.',
  })
  @Header('Deprecation', 'true')
  @Header('Link', '</v2/restaurants>; rel="successor-version"')
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
