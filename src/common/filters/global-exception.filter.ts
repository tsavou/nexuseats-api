import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    
    // Assure un requestId même s'il n'a pas été défini
    if (!request['requestId']) {
      request['requestId'] = randomUUID();
    }
    const requestId = request['requestId'];

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';
    let errorType = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      message = exceptionResponse.message || exception.message;
      errorType = exceptionResponse.error || exception.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 : Contrainte unique
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || ['champ'];
        message = `Un enregistrement avec cette valeur de ${target.join(', ')} existe déjà`;
        errorType = 'Conflict';
      }
      // P2025 : Record not found
      else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Enregistrement non trouvé';
        errorType = 'Not Found';
      }
      // P2003 : Foreign key
      else if (exception.code === 'P2003') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide';
        errorType = 'Bad Request';
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Autre Erreur (500)
      if (process.env.NODE_ENV === 'development') {
        message = exception.stack;
      } else {
        message = 'Une erreur inattendue est survenue';
      }
    }

    this.logger.error(
      `[${requestId}] Error ${statusCode} on ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        error: errorType,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      },
    });
  }
}
