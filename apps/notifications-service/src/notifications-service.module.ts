import { Module } from '@nestjs/common';
import { NotificationsServiceController } from './notifications-service.controller';

@Module({
  controllers: [NotificationsServiceController],
})
export class NotificationsServiceModule {}
