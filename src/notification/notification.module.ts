import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanModule } from 'src/digitalocean/digitalocean.module';
import { MyWebSocketGateway } from 'src/websocket/websocket.gateway';

@Module({
  imports: [forwardRef(() => DigitalOceanModule)], // Use forwardRef to avoid circular dependency
  providers: [NotificationService, MyWebSocketGateway, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
