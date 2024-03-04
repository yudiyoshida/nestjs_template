import { TestBed } from '@automock/jest';

import { CreateAccountController } from './create-account.controller';
import { CreateAccountService } from './create-account.service';
import { CreateAccountDto } from './dtos/create-account.dto';

const data: CreateAccountDto = {
  name: 'Jhon Doe',
  email: 'jhondoe@email.com',
  password: '123456789',
};

describe('CreateAccountController', () => {
  let controller: CreateAccountController;
  let mockService: jest.Mocked<CreateAccountService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(CreateAccountController).compile();

    controller = unit;
    mockService = unitRef.get(CreateAccountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call the service only once', async() => {
    await controller.handle({ ...data });

    expect(mockService.execute).toHaveBeenCalledTimes(1);
  });

  it('should call the service with correct arguments', async() => {
    await controller.handle({ ...data });

    expect(mockService.execute).toHaveBeenCalledWith(data);
  });
});
