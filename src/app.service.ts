import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return { api: 'AguaFix', version: '1.2.0', status: 'ok' };
  }
}
