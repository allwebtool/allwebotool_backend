import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MyWebSocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: MyWebSocketGateway,
  ) {}

  async createNotification(userId: string, message: string, url: string) {
    await this.prisma.notification.create({
      data: {
        userId,
        message,
        url,
      },
    });
  }

  sendNotificationToUser(userId: string, payload: any): void {
    this.notificationGateway.server.to(userId.toString()).emit('new_notification', payload);
  }
}
