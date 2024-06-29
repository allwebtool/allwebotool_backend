import { Controller, Post, UseInterceptors, UploadedFiles, Req, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DigitalOceanService } from './digitalocean.service';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSlug } from 'common/util/slugify';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { EnsureSubscription } from 'common/decorator/subscription.decorator';

@Controller()
export class DigitalOceanController {
  constructor(
    @InjectQueue('video-processing') private readonly videoQueue: Queue,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly prisma: PrismaService
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 2))
  async upload(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    if (!files || files.length !== 2) {
      throw new BadRequestException('Two files (video and audio) are required');
    }

    const videoFile = files.find(file => file.mimetype.startsWith('video/'));
    const audioFile = files.find(file => file.mimetype.startsWith('audio/'));

    if (!videoFile || !audioFile) {
      throw new BadRequestException('Both video and audio files are required');
    }

    const us:any = req?.user

    const user = await this.prisma.user.findFirst({ where: { email: us.email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const videoSlug = generateSlug(user.username) + '-video';
    const audioSlug = generateSlug(user.username) + '-audio';

    const videoUrl = await this.digitalOceanService.uploadFile(videoFile.buffer, videoSlug, videoFile.originalname);
    const audioUrl = await this.digitalOceanService.uploadFile(audioFile.buffer, audioSlug, audioFile.originalname);

    // Validate durations
    await this.digitalOceanService.validateFileDuration(videoUrl);
    await this.digitalOceanService.validateFileDuration(audioUrl);

    // Save file metadata to the database
    const video = await this.prisma.video.create({
      data: {
        userId: user.id,
        videoUrl,
        audioUrl,
      },
    });
  
    await this.videoQueue.add('process-video', { videoFile, audioFile, videoId: video.id, videoSlug: generateSlug(user.username)+'-result' });
    
    return { videoUrl };
  }
}
