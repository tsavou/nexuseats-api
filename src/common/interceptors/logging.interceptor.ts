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
import { MetricsService } from '../../health/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    if (!request.requestId) {
      request.requestId = randomUUID();
    }
    const requestId = request.requestId;

    const { method, url } = request;
    const route = this.getRouteKey(request);
    const now = Date.now();

    this.logger.log(
      `[pid:${process.pid}] [${requestId}] Incoming Request: ${method} ${url}`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const statusCode = ctx.getResponse().statusCode;
        this.metricsService.recordDuration(route, duration);

        const logMessage = `[pid:${process.pid}] [${requestId}] Request: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`;

        if (duration > 1000) {
          this.logger.warn(`${logMessage} (Lenteur détectée)`);
        } else {
          this.logger.log(logMessage);
        }
      }),
    );
  }

  private getRouteKey(request: any) {
    const path = request.route?.path
      ? `${request.baseUrl ?? ''}${request.route.path}`
      : (request.originalUrl?.split('?')[0] ?? request.url);

    return `${request.method} ${path}`;
  }
}
