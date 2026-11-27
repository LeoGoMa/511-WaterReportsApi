import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('regresa el estado de la API', () => {
      expect(appController.getStatus()).toEqual({
        api: 'AguaFix',
        version: '1.2.0',
        status: 'ok',
      });
    });
  });
});
