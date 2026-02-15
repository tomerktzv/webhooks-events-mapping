import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('port', 3000);
  }

  get apiPrefix(): string {
    return this.configService.get<string>('apiPrefix', 'api');
  }
}
