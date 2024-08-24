import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationModule } from 'src/notification/notification.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanController } from './digitalocean.controller';
import { DigitalOceanService } from './digitalocean.service';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [DigitalOceanController],
  providers: [ PrismaService, DigitalOceanService],
  exports: [],
})
export class DigitalOceanModule {}
