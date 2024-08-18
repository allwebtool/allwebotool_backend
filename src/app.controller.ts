import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicRoute } from 'common/decorator/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @PublicRoute()
  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
