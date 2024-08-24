import { Injectable, BadRequestException } from '@nestjs/common';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as ffmpeg from 'fluent-ffmpeg';
import { generateSlug } from 'common/util/slugify';
import { Upload } from '@aws-sdk/lib-storage';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class DigitalOceanService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.DO_S3_ENDPOINT,
      region: process.env.DO_S3_REGION,
      credentials: {
        accessKeyId: process.env.DO_S3_ACCESS_KEY,
        secretAccessKey: process.env.DO_S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(buffer: Buffer, slug: string, filename: string): Promise<string> {
    const key = `${generateSlug(slug)}/${filename}`;
    const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: process.env.DO_S3_SPACENAME,
        Key: key,
        Body: body,
        ACL: 'public-read',
      },
    });

    await upload.done();

    return `https://${process.env.DO_S3_SPACENAME}.nyc3.digitaloceanspaces.com/${key}`;
  }

  async getFileDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(url, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration);
      });
    });
  }

  async validateFileDuration(url: string): Promise<void> {
    console.log(url);
    const duration = await this.getFileDuration(url);
    console.log(duration);

    if (duration > 30) {
      throw new BadRequestException('File exceeds 30 seconds');
    }
  }

  async generateThumbnail(videoUrl: string, folder: string, slug: string): Promise<string> {
    const thumbnailFilename = `${slug}-thumbnail.png`;
    const thumbnailPath = join(folder, thumbnailFilename);

    return new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .on('end', async () => {
          try {
            const thumbnailBuffer = await fs.readFile(thumbnailPath);
            const thumbnailUrl = await this.uploadFile(thumbnailBuffer, folder, thumbnailFilename);
            await fs.unlink(thumbnailPath); // Clean up the temporary thumbnail file
            resolve(thumbnailUrl);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          reject(err);
        })
        .screenshots({
          count: 1,
          folder,
          filename: thumbnailFilename,
          size: '320x240',
        });
    });
  }
  async deleteFile(key: string): Promise<void> {
    const parsedUrl = new URL(key);
      const keyg = decodeURIComponent(parsedUrl.pathname.substring(1));
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.DO_S3_SPACENAME,
        Key: keyg,
      }));
    } catch (error) {
      throw new Error(`Failed to delete file from DigitalOcean: ${error.message}`);
    }
  }
}