import { Test, TestingModule } from '@nestjs/testing';

import { CreateAccountController } from './create-account.controller';
import { CreateAccountService } from './create-account.service';
import { CreateAccountDto } from './dtos/create-account.dto';

describe('CreateAccountController', () => {
  let controller: CreateAccountController;
  let serviceMock: CreateAccountService;

  const data: CreateAccountDto = {
    name: 'Jhon Doe',
    email: 'jhondoe@mail.com',
    password: '123456789',
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        CreateAccountController,
      ],
      providers: [
        {
          provide: CreateAccountService,
          useFactory: () => ({
            execute: jest.fn(() => {}),
          }),
        },
      ],
    }).compile();

    controller = module.get<CreateAccountController>(CreateAccountController);
    serviceMock = module.get<CreateAccountService>(CreateAccountService);
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
