import { Controller, Get,  Param, Delete, Req } from '@nestjs/common';
import { VideoService } from './video.service';
import { Request } from 'express';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user: any = req?.user
    return this.videoService.findAll(user?.email);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.videoService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.videoService.remove(id);
  }
}
