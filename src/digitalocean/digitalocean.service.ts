import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as FormData from "form-data"

@Injectable()
export class VideoClientService {
  private readonly logger = new Logger(VideoClientService.name);
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      // baseURL: 'http://localhost:7860', 
      baseURL: 'https://ashpexx-make-vid-talk.hf.space', 
      timeout: 20 * 60 * 1000, // 20 minutes timeout
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadVideoAndAudio(videoFile: any, audioFile: any): Promise<any> {
    try {
      console.log("hello here")
     
      const formData = new FormData();
      formData.append('video', Buffer.from(videoFile.buffer.data), videoFile.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, ''))
      formData.append('audio', Buffer.from(audioFile.buffer.data), audioFile.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, ''));

      // Send POST request to upload the video and audio
      const response = await this.apiClient.post('/upload', formData);
      return response.data;
    } catch (error) {
      this.logger.error(`REST API error: ${error.message}`);
      throw new Error(`Failed to upload video and audio: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/delete-file', { key })
      return response.data;
    } catch (error) {
      this.logger.error(`REST API error: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}