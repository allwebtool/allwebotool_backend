import axios from 'axios';
import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DigitalOceanService } from 'src/digitalocean/digitalocean.service';

@Injectable()
export class TtsvoicescloneService {
  constructor(
    private prisma: PrismaService,
    private digitalocean: DigitalOceanService,
  ) {}

  // Combine cloning and generating TTS process with stream handling
  async cloneAndGenerateTTS(
    voiceFile: Blob,
    name: string,
    text: string,
    emotion: string,
    apiKey: string,
    userId: string,
    curUser:string,
  ): Promise<any> {
    const formData = new FormData();
    formData.append('sample_file', voiceFile, "voice_sample.mp3");
    formData.append('voice_name', name);
    let voiceId =''

    try {
      // Clone the voice first
      const cloneResponse = await axios.post(
        'https://api.play.ht/api/v2/cloned-voices/instant',
        formData,
        {
          headers: {
            accept: 'application/json',
            'content-type': 'multipart/form-data',
            authorization: apiKey,
            'X-User-Id': userId,
          },
        },
      );

      voiceId = cloneResponse.data.id;
      // Generate TTS
      const ttsResponse = await this.generateTTS(voiceId, text, emotion, apiKey, userId, curUser, name);

      await axios.delete(
        'https://api.play.ht/api/v2/cloned-voices/',
        {
        data:{
            "voice_id": voiceId
        },
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: apiKey,
            'X-User-Id': userId,
          }
        },
      );  
      return ttsResponse;

    } catch (error) {
      console.log(error)
      throw new HttpException(
        'Failed to clone voice: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Handle TTS generation using stream
  async generateTTS(
    voiceId: string,
    text: string,
    emotion: string,
    apiKey: string,
    userId: string,
    curUser:string,
     name:string
  ): Promise<any> {
    try {
      const url = 'https://api.play.ht/api/v2/tts';
      const payload = {
        text,
        voice: voiceId,
        // emotion,
        output_format: 'mp3',
        voice_engine: 'PlayHT2.0',
      };

      const headers = {
        accept: 'application/json',
        authorization: apiKey,
        'X-User-Id': userId,
      };

      // Make an axios request to capture Server-Sent Events (SSE)
      const response = await axios({
        method: 'POST',
        url,
        headers,
        data: payload
      })

      await this.prisma.voiceClone.create({ data:{
        name: name,
        userId:curUser,
        voiceId: response.data.id,
      }})
      
    } catch (error) {
      console.log(error)
      throw new HttpException(
        'Failed to generate TTS: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Download file from the provided URL
  async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to download file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTTS(voiceId: string, apiKey:string, userId:string): Promise<any> {
    const options = {
      method: 'GET',
      url: `https://api.play.ht/api/v2/tts/${voiceId}`,
      headers: {
        accept: 'application/json',
        AUTHORIZATION: apiKey,
        'X-USER-ID': userId,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to fetch TTS data: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    const videos = await this.prisma.voiceClone.findMany({
      where: { userId: user.id },
      orderBy:{
        id: 'desc'
      }
    });

    return videos;
  }

}
