import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Inject,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '@nestjs/passport';
import { SkipTransform } from '../common/decorators/skip-transform.decorator';

@Controller({
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memoryHealth: MemoryHealthIndicator,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('health')
  @Public()
  @SkipThrottle()
  @SkipTransform()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.checkRedis(),
      () => this.memoryHealth.checkHeap('memory', 512 * 1024 * 1024),
    ]);
  }

  @Get('metrics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @SkipTransform()
  getMetrics() {
    return this.metricsService.getProcessMetrics();
  }

  private async checkRedis() {
    const indicator = this.healthIndicatorService.check('redis');
    const client = (this.cacheManager as any).store?.client;

    if (!client || typeof client.ping !== 'function') {
      throw new HealthCheckError(
        'Redis client unavailable',
        indicator.down({ message: 'Redis client unavailable' }),
      );
    }

    try {
      await client.ping();
      return indicator.up();
    } catch (error) {
      throw new HealthCheckError(
        'Redis ping failed',
        indicator.down({
          message:
            error instanceof Error ? error.message : 'Redis ping failed',
        }),
      );
    }
  }
}
