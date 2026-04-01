import { Module } from '@nestjs/common';
import { AnalyticsServiceController } from './analytics-service.controller';

@Module({
  controllers: [AnalyticsServiceController],
})
export class AnalyticsServiceModule {}
