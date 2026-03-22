import { Injectable } from '@nestjs/common';

type RouteMetrics = {
  count: number;
  durations: number[];
};

@Injectable()
export class MetricsService {
  private readonly routeMetrics = new Map<string, RouteMetrics>();

  incrementRoute(route: string) {
    const current = this.routeMetrics.get(route) ?? { count: 0, durations: [] };
    current.count += 1;
    this.routeMetrics.set(route, current);
  }

  recordDuration(route: string, duration: number) {
    const current = this.routeMetrics.get(route) ?? { count: 0, durations: [] };
    current.durations.push(duration);
    this.routeMetrics.set(route, current);
  }

  getRequestCounts() {
    return Object.fromEntries(
      [...this.routeMetrics.entries()].map(([route, metrics]) => [
        route,
        metrics.count,
      ]),
    );
  }

  getP95ResponseTime() {
    const durations = [...this.routeMetrics.values()]
      .flatMap((metrics) => metrics.durations)
      .sort((a, b) => a - b);

    if (durations.length === 0) {
      return 0;
    }

    const index = Math.ceil(durations.length * 0.95) - 1;
    return durations[Math.max(0, index)];
  }

  getProcessMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        rss: memoryUsage.rss,
      },
      requestCounts: this.getRequestCounts(),
      p95ResponseTime: this.getP95ResponseTime(),
    };
  }
}
