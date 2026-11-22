import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// @nestjs/typeorm es solo ESM y Jest no lo carga; el servicio real se prueba contra la base de datos.
jest.mock('./users.service', () => ({ UsersService: class {} }));

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = { findAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('lista los usuarios que regresa el servicio', async () => {
    const users = [
      {
        id: 1,
        name: 'Ana',
        email: 'ana@mail.com',
        isNotificationEnabled: true,
      },
    ];
    usersService.findAll.mockResolvedValue(users);

    await expect(controller.findAll()).resolves.toEqual(users);
  });
});
