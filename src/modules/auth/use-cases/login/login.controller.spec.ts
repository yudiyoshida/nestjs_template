import { Test, TestingModule } from '@nestjs/testing';

import { LoginDto } from './dtos/login.dto';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

describe('LoginController', () => {
  let controller: LoginController;
  let serviceMock: LoginService;

  const data: LoginDto = {
    email: 'jhondoe@emai.com',
    password: '123456798',
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        LoginController,
      ],
      providers: [
        {
          provide: LoginService,
          useFactory: () => ({
            execute: jest.fn(() => {}),
          }),
        },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
    serviceMock = module.get<LoginService>(LoginService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call the service only once', async() => {
    await controller.handle(data);

    expect(serviceMock.execute).toHaveBeenCalledTimes(1);
  });

  it('should call the service with correct arguments', async() => {
    await controller.handle(data);

    expect(serviceMock.execute).toHaveBeenCalledWith(data);
  });
});
