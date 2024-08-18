import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

 

  async findAll(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    const videos = await this.prisma.video.findMany({
      where: { userId: user.id },
    });

    return videos;
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    return video;
  }

  async remove(id: string) {
    const video = await this.prisma.video.delete({
      where: { id },
    });

    return video;
  }
}
