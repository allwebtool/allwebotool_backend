import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideoProcessor } from './digitalocean.processor';
import { NotificationModule } from 'src/notification/notification.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanController } from './digitalocean.controller';
import { VideoClientService } from './digitalocean.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'video-processing',
    }),
    forwardRef(() => NotificationModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [DigitalOceanController],
  providers: [VideoClientService, PrismaService, VideoProcessor],
  exports: [VideoClientService],
})
export class DigitalOceanModule {}
