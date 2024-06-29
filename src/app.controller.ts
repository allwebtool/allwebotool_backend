import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicRoute } from 'common/decorator/public.decorator';
import { EnsureSubscription } from 'common/decorator/subscription.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @PublicRoute()
  @Get()
  @EnsureSubscription()
  getHello() {
    return this.appService.getHello();
  }
}
