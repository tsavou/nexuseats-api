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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('health')
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
  @ApiOperation({
    summary: "Vérifier la santé de l'application",
    description:
      "Vérifie l'état de la base de données PostgreSQL, du cache Redis et de la mémoire heap. " +
      'Endpoint public, non soumis au rate limiting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application en bonne santé',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Un ou plusieurs services sont indisponibles',
    schema: {
      example: {
        status: 'error',
        info: {
          database: { status: 'up' },
        },
        error: {
          redis: {
            status: 'down',
            message: 'Redis client unavailable',
          },
        },
        details: {
          database: { status: 'up' },
          redis: { status: 'down', message: 'Redis client unavailable' },
        },
      },
    },
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Métriques du processus Node.js",
    description:
      "Retourne les métriques système du processus : uptime, mémoire, CPU. " +
      "Réservé aux administrateurs uniquement.",
  })
  @ApiResponse({
    status: 200,
    description: 'Métriques récupérées avec succès',
    schema: {
      example: {
        uptime: 3600,
        memory: {
          rss: 85000000,
          heapTotal: 45000000,
          heapUsed: 32000000,
          external: 1200000,
        },
        cpu: {
          user: 12500000,
          system: 3400000,
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
    description: 'Accès refusé (rôle admin requis)',
  })
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

