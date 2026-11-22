import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return { api: 'AguaFix', version: '1.0.0', status: 'ok' };
  }
}
