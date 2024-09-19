import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationModule } from 'src/notification/notification.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanController } from './digitalocean.controller';
import { DigitalOceanService } from './digitalocean.service';
import { BillingService } from 'src/billing/billing.service';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [DigitalOceanController],
  providers: [ PrismaService, DigitalOceanService,BillingService],
  exports: [],
})
export class DigitalOceanModule {}
