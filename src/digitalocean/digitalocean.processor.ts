import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanService } from './digitalocean.service';
import { NotificationService } from 'src/notification/notification.service';
import { Logger } from '@nestjs/common';

@Processor('video-processing')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly notificationService: NotificationService,
  ) {}

  @Process('process-video')
  async handleVideoProcessing(job: Job) {
    const { videoFile, audioFile, videoId, videoSlug } = job.data;
    this.logger.log(`Processing video job: ${videoId}`);

    try {
      this.logger.log("Simulating third-party API processing");
      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
      
      const videoUrl = await this.digitalOceanService.uploadFile(videoFile.buffer, videoSlug, videoFile.originalname);
      const thumbnailUrl = await this.digitalOceanService.generateThumbnail(videoUrl, videoSlug+'thumbnail', videoSlug);

      const video = await this.prisma.video.update({
        where: { id: videoId },
        data: { resultUrl: videoUrl, thumbnailUrl },
      });

      await this.notificationService.createNotification(video.userId, `#${video.id}: Your video is ready!`, video.resultUrl);

      this.notificationService.sendNotificationToUser(video.userId, { message: 'Your video is ready!', videoUrl: video.resultUrl });
      this.logger.log("Note sent", video.userId);
     return
    } catch (error) {
      this.logger.error(`Failed to process video job: ${error.message}`, error.stack);
    }
  }
}
