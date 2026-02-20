import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TipDto } from 'src/app/_examples/tip/application/dtos/tip.dto';
import { CreateLocalTip } from 'src/app/_examples/tip/application/usecases/create-local-tip/create-local-tip.service';
import { CreateLocalTipInputDto, CreateLocalTipOutputDto } from 'src/app/_examples/tip/application/usecases/create-local-tip/dtos/create-local-tip.dto';
import { CreateWeatherTip } from 'src/app/_examples/tip/application/usecases/create-weather-tip/create-weather-tip.service';
import { CreateWeatherTipInputDto, CreateWeatherTipOutputDto } from 'src/app/_examples/tip/application/usecases/create-weather-tip/dtos/create-weather-tip.dto';
import { DeleteTip } from 'src/app/_examples/tip/application/usecases/delete-tip/delete-tip.service';
import { EditTipInputDto } from 'src/app/_examples/tip/application/usecases/edit-tip/dtos/edit-tip.dto';
import { EditTip } from 'src/app/_examples/tip/application/usecases/edit-tip/edit-tip.service';
import { FindAllTipQueryDto } from 'src/app/_examples/tip/application/usecases/find-all-tip/dtos/find-all-tip-query.dto';
import { FindAllTip } from 'src/app/_examples/tip/application/usecases/find-all-tip/find-all-tip.service';
import { FindTipById } from 'src/app/_examples/tip/application/usecases/find-tip-by-id/find-tip-by-id.service';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { TipUserController } from './tip-user.controller';

// Veja arquivo `src/app/faq/infra/drivers/http/user/faq-user.controller.spec.ts`, confia.

describe('TipUserController - Unit tests', () => {
  let sut: TipUserController;
  let createWeatherTipService: CreateWeatherTip;
  let createLocalTipService: CreateLocalTip;
  let findAllTipService: FindAllTip;
  let findTipByIdService: FindTipById;
  let editTipService: EditTip;
  let deleteTipService: DeleteTip;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [TipUserController],
      providers: [
        { provide: CreateWeatherTip, useValue: createMock<CreateWeatherTip>() },
        { provide: CreateLocalTip, useValue: createMock<CreateLocalTip>() },
        { provide: FindAllTip, useValue: createMock<FindAllTip>() },
        { provide: FindTipById, useValue: createMock<FindTipById>() },
        { provide: EditTip, useValue: createMock<EditTip>() },
        { provide: DeleteTip, useValue: createMock<DeleteTip>() },
      ],
    }).compile();

    sut = module.get(TipUserController);
    createWeatherTipService = module.get(CreateWeatherTip);
    createLocalTipService = module.get(CreateLocalTip);
    findAllTipService = module.get(FindAllTip);
    findTipByIdService = module.get(FindTipById);
    editTipService = module.get(EditTip);
    deleteTipService = module.get(DeleteTip);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('createWeather', () => {
    it('should call createWeatherTip.execute with body and user id', async() => {
      // Arrange
      const body = createMock<CreateWeatherTipInputDto>();
      const user = createMock<Payload>();
      const output = createMock<CreateWeatherTipOutputDto>();
      const createSpy = jest.spyOn(createWeatherTipService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.createWeather(body, user);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body, user.sub);
    });
  });

  describe('createLocal', () => {
    it('should call createLocalTip.execute with body and user id', async() => {
      // Arrange
      const body = createMock<CreateLocalTipInputDto>();
      const user = createMock<Payload>();
      const output = createMock<CreateLocalTipOutputDto>();
      const createSpy = jest.spyOn(createLocalTipService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.createLocal(body, user);

      // Assert
      expect(result).toEqual(output);
      expect(createSpy).toHaveBeenCalledWith(body, user.sub);
    });
  });

  describe('findAll', () => {
    it('should call findAllTip.execute with query', async() => {
      // Arrange
      const query = createMock<FindAllTipQueryDto>();
      const output = createMock<IPagination<TipDto>>();
      const findAllSpy = jest.spyOn(findAllTipService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(query);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith({
        ...query,
        status: TipStatus.ACTIVE,
      });
    });
  });

  describe('findById', () => {
    it('should call findTipById.execute with params', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<TipDto>();
      const findByIdSpy = jest.spyOn(findTipByIdService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findById(params);

      // Assert
      expect(result).toEqual(output);
      expect(findByIdSpy).toHaveBeenCalledWith(params.id);
    });

    it('should return null when tip not found', async() => {
      // Arrange
      const params = createMock<Params>();
      const findByIdSpy = jest.spyOn(findTipByIdService, 'execute').mockResolvedValue(null);

      // Act
      const result = await sut.findById(params);

      // Assert
      expect(result).toBeNull();
      expect(findByIdSpy).toHaveBeenCalledWith(params.id);
    });
  });

  describe('edit', () => {
    it('should call editTip.execute with id and body', async() => {
      // Arrange
      const user = createMock<Payload>();
      const params = createMock<Params>();
      const body = createMock<EditTipInputDto>();
      const output = createMock<SuccessMessage>();
      const editSpy = jest.spyOn(editTipService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.edit(params, body, user);

      // Assert
      expect(result).toEqual(output);
      expect(editSpy).toHaveBeenCalledWith(params.id, body, user.sub);
    });
  });

  describe('delete', () => {
    it('should call deleteTip.execute with id', async() => {
      // Arrange
      const user = createMock<Payload>();
      const params = createMock<Params>();
      const output = createMock<SuccessMessage>();
      const deleteSpy = jest.spyOn(deleteTipService, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.delete(params, user);

      // Assert
      expect(result).toEqual(output);
      expect(deleteSpy).toHaveBeenCalledWith(params.id, user.sub);
    });
  });
});
