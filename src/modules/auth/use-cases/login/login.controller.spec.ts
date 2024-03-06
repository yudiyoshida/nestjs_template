import { TestBed } from '@automock/jest';
import { LoginDto } from './dtos/login.dto';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

const data: LoginDto = {
  email: 'jhondoe@emai.com',
  password: '123456798',
};

describe('LoginController', () => {
  let controller: LoginController;
  let mockService: jest.Mocked<LoginService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(LoginController).compile();

    controller = unit;
    mockService = unitRef.get(LoginService);
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
