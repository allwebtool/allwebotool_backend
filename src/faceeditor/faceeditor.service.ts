import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class FaceEditorService {

  private readonly apiBaseUrl = 'https://api.newportai.com/api/async';

  async mergeFace(mainImageUrl: string, faceImageUrl: string, authorization: string) {
    try {
      const body = {
        url: mainImageUrl,
        faceImgeUrl: faceImageUrl,  // Keep API's specific field name
      };

      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };

      const response = await fetch(`${this.apiBaseUrl}/merge_face`, requestOptions);
      const result = await response.json();

      if (!result || result.code !== 0) {
        throw new BadRequestException(result?.message || 'Face merge failed');
      }

      return result;
    } catch (error) {
      console.error('Error merging face:', error);
      throw new BadRequestException('Face merge failed');
    }
  }

  async restoreFace(mainImageUrl: string, authorization: string) {
    try {
      const body = { url: mainImageUrl };

      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };

      const response = await fetch(`${this.apiBaseUrl}/restore_face`, requestOptions);
      const result = await response.json();

      if (!result || result.code !== 0) {
        throw new BadRequestException(result?.message || 'Face restoration failed');
      }

      return result;
    } catch (error) {
      console.error('Error restoring face:', error);
      throw new BadRequestException('Face restoration failed');
    }
  }

  
}
