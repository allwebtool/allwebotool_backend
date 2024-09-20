import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TtsvoicescloneService } from './ttsvoicesclone.service';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { BillingService } from 'src/billing/billing.service';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';
import { randomUUID } from 'crypto';

@Controller('voice-clone')
export class TtsvoicescloneController {
  constructor(private readonly ttsvoicescloneService: TtsvoicescloneService, 
    private readonly prisma:PrismaService,
    private readonly billingService: BillingService,
    private digitalocean: DigitalOceanService,


  ) {}

  @Get()
  findAll(@Req() req: Request) {
    const user: any = req?.user
    return this.ttsvoicescloneService.findAll(user?.email);
  }

  // Create and clone voice
  @Post()
  @UseInterceptors(FileInterceptor('voiceFile'))
  async cloneVoice(
    @UploadedFile() voiceFile: Express.Multer.File,
    @Body('name') name: string,
    @Body('text') text: string,
    @Body('emotion') emotion: string,
    @Body('apiKey') apiKey: string,
    @Body('userId') userId: string,
    @Req() req:Request
  ) {
    if (!voiceFile) {
      throw new HttpException(
        'Voice file is required for cloning',
        HttpStatus.BAD_REQUEST
      );
    }
    const usr:any = req.user
    const user = await this.prisma.user.findFirst({where:{email: usr.email}})

    try {
      // Call service to clone voice and generate TTS
      const result = await this.ttsvoicescloneService.cloneAndGenerateTTS(
        new Blob([voiceFile.buffer], {type: 'audio/mpeg'}),
        name,
        text,
        emotion,
        apiKey,
        userId,
        user.id
      );

      return {
        message: 'Voice cloned and TTS generated successfully',
        result,
      };
    } catch (error) {
      console.log(error)
      throw new HttpException(
        `Error cloning voice: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':voiceId')
  async getTTS(@Param('voiceId') voiceId: string, @Query('apiKey') apiKey: string, @Query('userId') userId: string, @Req() req:Request) {
    try {
      const usr:any = req.user
      const ttsData = await this.ttsvoicescloneService.getTTS(voiceId, apiKey, userId);
      if (ttsData?.status === 'complete') {
        const lets = await this.billingService.billAm(usr.email, Math.ceil(ttsData.output.duration*2))
        if (lets === "insufficient"){
           await this.prisma.voiceClone.updateMany({where:{voiceId}, data:{ status: "failed"}})
           return {status: "failed"}
          }
        const file = await this.ttsvoicescloneService.downloadFile(ttsData.output.url)
        const url = await this.digitalocean.uploadFile(file,userId, randomUUID()+'-audio.mp3')
        await this.prisma.voiceClone.updateMany({where:{voiceId}, data:{resultUrl: url, status: "successful"}});
        console.log(lets)
        return { status: "success" }
      }

      if (ttsData?.status === 'failed') {
        await this.prisma.voiceClone.updateMany({where:{voiceId}, data:{status: "failed"}});
        throw new Error('Task failed');
      }

      return { status: "processing" };
    } catch (error) {
      throw new HttpException(
        'Error retrieving TTS data: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  
 
}
