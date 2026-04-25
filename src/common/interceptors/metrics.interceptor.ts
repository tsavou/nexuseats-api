import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from '../../health/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const route = this.getRouteKey(request);

    this.metricsService.incrementRoute(route);

    return next.handle();
  }

  private getRouteKey(request: any) {
    const path = request.route?.path
      ? `${request.baseUrl ?? ''}${request.route.path}`
      : (request.originalUrl?.split('?')[0] ?? request.url);

    return `${request.method} ${path}`;
  }
}
