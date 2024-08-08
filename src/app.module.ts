import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard, SubscriptionGuard } from 'common/guard';
import { DigitalOceanModule } from './digitalocean/digitalocean.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReqloggerMiddleware } from './reqlogger/reqlogger.middleware';
import { BillingModule } from './billing/billing.module';
import { WebSocketModule } from './websocket/websocket.module';
import { NotificationModule } from './notification/notification.module';
import { BullModule } from '@nestjs/bull';
import { PaymentplanModule } from './paymentplan/paymentplan.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [AppModule, 
    BullModule.forRoot({
      redis: {
        host: 'db-redis-nyc3-90505-do-user-14642751-0.m.db.ondigitalocean.com',
        port: 25061,
        username: 'default',
        password: 'AVNS_z2YRh9mfhoj3Oy3p5PP',
        tls: {}
      },
    }),
    ConfigModule.forRoot({ isGlobal: true }), 
    AuthModule,
    EmailModule, 
    DigitalOceanModule,
    PrismaModule,
    BillingModule,
    WebSocketModule,
    NotificationModule,
    PaymentplanModule,
    UserModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService, 
    {
    provide: APP_GUARD,
    useClass: AtGuard
  },
  {
    provide: APP_GUARD,
    useClass: SubscriptionGuard,
  },
   PrismaService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ReqloggerMiddleware).forRoutes('*');
  }
}

