import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { SkipTransform } from './common/decorators/skip-transform.decorator';

@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  constructor() {}

  @Get('sw.js')
  @Public()
  @SkipThrottle()
  @SkipTransform()
  @HttpCode(HttpStatus.NO_CONTENT)
  getServiceWorker() {
    return;
  }
}
