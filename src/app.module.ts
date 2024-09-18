import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from 'common/guard';
import { DigitalOceanModule } from './digitalocean/digitalocean.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReqloggerMiddleware } from './reqlogger/reqlogger.middleware';
import { BillingModule } from './billing/billing.module';
import { WebSocketModule } from './websocket/websocket.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentplanModule } from './paymentplan/paymentplan.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';
import { TtsvoicescloneModule } from './ttsvoicesclone/ttsvoicesclone.module';
import { FaceeditorModule } from './faceeditor/faceeditor.module';
import { ImageeditorModule } from './imageeditor/imageeditor.module';

@Module({
  imports: [AppModule, 
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
    TtsvoicescloneModule,
    FaceeditorModule,
    ImageeditorModule,
  ],
  controllers: [AppController],
  providers: [AppService, 
    {
    provide: APP_GUARD,
    useClass: AtGuard
  },
   PrismaService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ReqloggerMiddleware).forRoutes('*');
  }
}
