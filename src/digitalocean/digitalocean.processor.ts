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
    const { videoFile, audioFile, videoData } = job.data;
    
    try {
      const response = await this.videoClientService.uploadVideoAndAudio(videoFile, audioFile);

      const video = await this.prisma.video.update({
        where:{id: videoData.id},
        data: { videoUrl: response.video_url, audioUrl: response.audio_url, resultUrl: response.result_url, thumbnailUrl: response.thumbnail_url, status:"successful" },
      });

      await this.notificationService.createNotification(video.userId, `#${video.id}: Your video is ready!`, video.resultUrl);

      this.notificationService.sendNotificationToUser(video.userId, { message: 'Your video is ready!', videoUrl: video.resultUrl });
      this.logger.log("Note sent", video.userId);
     return
    } catch (error) {
      await this.prisma.video.update({
        where:{id: videoData.id},
        data: { status:"failed" },
      });
      this.logger.error(`Failed to process video job: ${error.message}`, error.stack);
    }
  }
}
