// email.module.ts

import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          secure: true,
          auth: {
            user: config.get('SUPPORT_SMTP_USER'),
            pass: config.get('SUPPORT_SMTP_PASS'),
          },
        },
        defaults: {
          from: '"Allwebtool" <hello@allwebtool.com>',
        },
        template: {
          dir: join(__dirname,'..','..','email','templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
