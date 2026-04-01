import { ApiProperty } from '@nestjs/swagger';

/**
 * Format d'erreur standardise retourne par le GlobalExceptionFilter.
 *
 * Toutes les reponses d'erreur de l'API suivent cette structure,
 * permettant au front-end de parser les erreurs de maniere uniforme.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indique que la requete a echoue',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: "Details de l'erreur",
    type: 'object',
    properties: {
      statusCode: {
        type: 'number',
        description: "Code HTTP de l'erreur",
        example: 400,
      },
      message: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
        description:
          "Message d'erreur (string ou tableau de messages de validation)",
        example: 'Le nom doit faire au moins 2 caracteres',
      },
      error: {
        type: 'string',
        description: "Type d'erreur HTTP",
        example: 'Bad Request',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: "Horodatage de l'erreur au format ISO 8601",
        example: '2026-03-22T14:30:00.000Z',
      },
      path: {
        type: 'string',
        description: 'Chemin de la requete ayant echoue',
        example: '/api/v2/restaurants',
      },
      requestId: {
        type: 'string',
        format: 'uuid',
        description: 'Identifiant unique de la requete pour le support',
        example: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
      },
    },
  })
  error: {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
