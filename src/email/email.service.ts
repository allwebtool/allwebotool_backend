// email.service.ts

import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendOTP(user: any, token: string) {
    try{
        await this.mailerService.sendMail({
      to: user.email,
      from: '"Allwebtool" <hello@allwebtool.com>',
      subject: 'Allwebtool EMail verification',
      template: './otp.template.ejs', // `.ejs` extension is appended automatically
      context: { // filling <%= %> brackets with content
        name: user.username,
        otp: token,
      },
    });
    }catch(e){
        throw new BadRequestException(e.message)
    }
  }

  async sendPasswordReset(user: any, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset',
      template: './reset-password', // Assuming you have a template for this
      context: {
        name: user.username,
        resetUrl,
      },
    });
  }
}
