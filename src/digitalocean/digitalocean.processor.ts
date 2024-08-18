import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { Logger } from '@nestjs/common';
import { VideoClientService } from './digitalocean.service';

@Processor('video-processing')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoClientService: VideoClientService,
    private readonly notificationService: NotificationService,
  ) {}

  @Process('process-video')
  async handleVideoProcessing(job: Job) {
    const { videoFile, audioFile, user } = job.data;
    
    try {
      const response = await this.videoClientService.uploadVideoAndAudio(videoFile, audioFile);

      const video = await this.prisma.video.create({
        data: { videoUrl: response.videoUrl, audioUrl: response.audioUrl, resultUrl: response.resultUrl, thumbnailUrl: response.thumbnailUrl, userId: user.id },
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
