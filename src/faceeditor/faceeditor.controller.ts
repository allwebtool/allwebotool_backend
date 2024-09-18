import { Controller, Post, UseInterceptors, UploadedFiles, BadRequestException, Req, Headers } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FaceEditorService } from './faceeditor.service';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSlug } from 'common/util/slugify';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';

@Controller('face-editor')
export class FaceEditorController {
  constructor(
    private readonly faceEditorService: FaceEditorService,
    private readonly digitalOceanService: DigitalOceanService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 2))  // Accept up to 2 files: one for restoration, two for editing
  async processFaceEditing(
    @UploadedFiles() files: Express.Multer.File[], 
    @Req() req: Request,
    @Headers('Authorization') authorization: string
  ) {
    try {
      const { action } = req.body;

      if (!action) {
        throw new BadRequestException('Action is required');
      }

      // Handle at least one file (for restoration) and up to two files (for editing)
      if (!files || files.length < 1) {
        throw new BadRequestException('At least one file is required');
      }

      const mainImage = files[0];
      const faceImage = files.length > 1 ? files[1] : null;

      const us: any = req?.user;

      const user = await this.prisma.user.findFirst({ where: { email: us.email } });
      if (!user) {
        throw new BadRequestException('User not found');
      }


      // Upload the files to DigitalOcean
      const { mainImageUrl, faceImageUrl } = await this.uploadFilesToDigitalOcean(user.username, mainImage, faceImage);

      let response;
      if (action === 'faceediting') {
        if (!faceImageUrl) {
          throw new BadRequestException('A face image is required for face editing');
        }
        response = await this.faceEditorService.mergeFace(mainImageUrl, faceImageUrl, authorization);
      } else if (action === 'restoration') {
        response = await this.faceEditorService.restoreFace(mainImageUrl, authorization);
      } else {
        throw new BadRequestException('Invalid action');
      }
      const userId:string = user.id
      // Save file metadata and processing result to the database
      const savedData = await this.prisma.faceEditor.create({
        data: {
          action,
          userId,
          mainImageUrl,
          faceImageUrl,
          status: "initiated" 
        }
      });

      return savedData;
    } catch (error) {
      console.error('Error in face processing:', error);
      throw new BadRequestException(error.message || 'Face processing failed');
    }
  }


  // Method to upload files to DigitalOcean
  private async uploadFilesToDigitalOcean(username: string, mainImage: Express.Multer.File, faceImage?: Express.Multer.File) {
    const mainImageSlug = generateSlug(username) + '-main';
    const faceImageSlug = faceImage ? generateSlug(username) + '-face' : null;

    const mainImageUrl = await this.digitalOceanService.uploadFile(mainImage.buffer, mainImageSlug, this.sanitizeFilename(mainImage.originalname));
    let faceImageUrl = null;

    if (faceImage) {
      faceImageUrl = await this.digitalOceanService.uploadFile(faceImage.buffer, faceImageSlug, this.sanitizeFilename(faceImage.originalname));
    }

    return { mainImageUrl, faceImageUrl };
  }

  // Helper to sanitize filenames
  private sanitizeFilename = (filename: string) => {
    return filename
      .replace(/\s+/g, '_')    
      .replace(/[^a-zA-Z0-9_.-]/g, '');
  };
}
