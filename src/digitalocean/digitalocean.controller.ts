import { Controller, Post, UseInterceptors, UploadedFiles, Req, BadRequestException, Get, Param, Delete, Body, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DigitalOceanService } from './digitalocean.service';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSlug } from 'common/util/slugify';
import { BillingService } from 'src/billing/billing.service';

@Controller()
export class DigitalOceanController {
  constructor(
    private readonly digitalOceanService: DigitalOceanService,
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 2))
  async upload(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request, @Body('apiKey') apiKey: string) {

    try{
    if (!files || files.length !== 2) {
      throw new BadRequestException('Two files (video and audio) are required');
    }

    const videoFile = files.find(file => file.mimetype.startsWith('video/'));
    const audioFile = files.find(file => file.mimetype.startsWith('audio/'));
    if (!videoFile || !audioFile) {
      throw new BadRequestException('Both video and audio files are required');
    }

    const user = await this.getUserFromRequest(req);

    const { videoUrl, audioUrl, videoln } = await this.uploadFilesToDigitalOcean(user.username, videoFile, audioFile);
    const uniqueSuffix = `${Date.now()}`;
  const thumbnailFileName = `${generateSlug(user.username)}-${uniqueSuffix}-thumbnail.jpg`;

  // Generate thumbnail from the video file
  const thumbnail = await this.digitalOceanService.generateThumbnail(videoUrl, 'thumbnails', thumbnailFileName);

  await this.billingService.billAm(user.email, Math.ceil(videoln*0.5))
    // Newport AI API call
    const taskId = await this.processVideoWithNewportAI(videoUrl, audioUrl, apiKey);

    // Save file metadata to the database
    const video = await this.prisma.video.create({
      data: {
        userId: user.id,
        videoUrl,
        audioUrl,
        thumbnailUrl: thumbnail,
        taskId
      }
    });

    return video
  }catch(e){
    console.log(e)
    throw new BadRequestException(e?.response?.message || e.message);
  }
  }

  private async getUserFromRequest(req: Request) {
    const us: any = req?.user;

    const user = await this.prisma.user.findFirst({ where: { email: us.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }
  private sanitizeFilename = (filename:string) => {
    return filename
      .replace(/\s+/g, '_')    
      .replace(/[^a-zA-Z0-9_.-]/g, '')
  }

  private async uploadFilesToDigitalOcean(username: string, videoFile: Express.Multer.File, audioFile: Express.Multer.File) {
    const videoSlug = generateSlug(username) + '-video';
    const audioSlug = generateSlug(username) + '-audio';

    const videoUrl = await this.digitalOceanService.uploadFile(videoFile.buffer, videoSlug, this.sanitizeFilename(videoFile.originalname));
    const audioUrl = await this.digitalOceanService.uploadFile(audioFile.buffer, audioSlug, this.sanitizeFilename(audioFile.originalname));

    // Validate durations
    const videoln = await this.digitalOceanService.validateFileDuration(videoUrl);
    await this.digitalOceanService.validateFileDuration(audioUrl);

    return { videoUrl, audioUrl, videoln };
  }

  private async processVideoWithNewportAI(videoUrl: string, audioUrl: string, apiKey:string): Promise<string> {
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    });

    const raw = JSON.stringify({
      "srcVideoUrl": videoUrl,
      "audioUrl": audioUrl,
      "videoParams": {
        "video_bitrate": 0,
        "video_width": 0,
        "video_height": 0,
        "video_enhance": 1
      }
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    try {
      const response = await fetch("https://api.newportai.com/api/async/talking_face", requestOptions);
      const result = await response.json();
      console.log(result)
      if (!result?.data?.taskId) {
        throw new Error('Failed to retrieve taskId from Newport AI');
      }

      return result.data.taskId;
    } catch (error) {
      console.error("Error during Newport AI API call:", error);
      throw new Error('Newport AI API call failed');
    }
  }

  @Get('upload/:taskId')
  async pollForResult(@Param('taskId') taskId: string, @Query('apiKey') apiKey: string) {
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    });
    console.log(apiKey)
    try {
      const result = await this.fetchAsyncResult(taskId, myHeaders);

      if (result?.code === 0) {
        await this.updateVideoResultUrl(taskId, result?.data?.videos[0]?.videoUrl);
        return { status: "success" };
      }

      if (result?.message === 'failed') {
        await this.updateVideoStatus(taskId, "failed");
        throw new Error('Task failed');
      }

      return { status: "processing" };
    } catch (error) {
      console.error("Error during polling:", error);
      await this.updateVideoStatus(taskId, "failed");
      throw new Error('Task failed');
    }
  }

  @Delete('video/:id')
  async deleteVideo(@Param('id') id: string) {
    console.log(id)
    const video = await this.prisma.video.findFirst({ where: { id: id } });
    if (!video) {
      throw new BadRequestException('Video not found');
    }

    await this.digitalOceanService.deleteFile(video.videoUrl)
    await this.digitalOceanService.deleteFile(video.audioUrl)
    await this.digitalOceanService.deleteFile(video.thumbnailUrl)
    

    // Delete video metadata from database
    await this.prisma.video.delete({ where: { id: id } });

    return { message: 'Video deleted successfully' };
  }

  private async fetchAsyncResult(taskId: string, headers: HeadersInit) {
    const requestOptions = {
      method: "POST",
      headers,
      body: JSON.stringify({ taskId }),
    };

    const response = await fetch("https://api.newportai.com/api/getAsyncResult", requestOptions);
    return response.json();
  }

  private async updateVideoResultUrl(taskId: string, resultUrl: string) {
    await this.prisma.video.updateMany({
      where: { taskId },
      data: { resultUrl, status: "successful" }
    });
  }

  private async updateVideoStatus(taskId: string, status: any) {
    await this.prisma.video.updateMany({
      where: { taskId },
      data: { status }
    });
  }
}
