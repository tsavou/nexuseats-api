import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    if (!request.requestId) {
      request.requestId = randomUUID();
    }
    const requestId = request.requestId;

    const { method, url } = request;
    const now = Date.now();

    this.logger.log(`[${requestId}] Incoming Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const statusCode = ctx.getResponse().statusCode;
        
        const logMessage = `[${requestId}] Request: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`;

        if (duration > 1000) {
          this.logger.warn(`${logMessage} (Lenteur détectée)`);
        } else {
          this.logger.log(logMessage);
        }
      }),
    );
  }
}
