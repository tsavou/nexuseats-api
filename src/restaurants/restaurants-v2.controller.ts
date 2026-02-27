import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, ParseUUIDPipe,
  Version,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantV2Dto } from './dto/create-restaurant-v2.dto';
import { UpdateRestaurantV2Dto } from './dto/update-restaurant-v2.dto';
import { Restaurant } from './entities/restaurant.entity';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

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
            cuisineType: 'italienne',
            rating: 4.2,
            averagePrice: 25,
            countryCode: '+33',
            localNumber: '612345678',
            description: 'Restaurant italien authentique au coeur de Paris',
          },
        ],
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.restaurantsService.findAll(page, limit);
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
  create(@Body() dto: CreateRestaurantV2Dto) {
    return this.restaurantsService.create(dto);
  }

  // ─────────────────────────────────────────────
  // PATCH /restaurants/:id → 200 OK
  // ─────────────────────────────────────────────

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
    return this.restaurantsService.update(id, dto);
  }

  // ─────────────────────────────────────────────
  // DELETE /restaurants/:id → 204 No Content
  // ─────────────────────────────────────────────

  @Version('2')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un restaurant',
    description: 'Supprime définitivement un restaurant de la plateforme.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du restaurant à supprimer',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 204,
    description: 'Restaurant supprimé avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant introuvable',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.restaurantsService.remove(id);
  }
}