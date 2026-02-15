import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface Station { 
  name: string, 
  position: number
}

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}


  /**
   * Placeholder method for GET API request
   * Replace the URL and add any necessary headers/params as needed
   */
  async getApiData(apiUrl: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, {
        })
      );
      return response.data;
    } catch (error) {
      // Handle error appropriately
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}
