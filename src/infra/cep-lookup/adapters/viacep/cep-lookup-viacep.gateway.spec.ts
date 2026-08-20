import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CepLookupOutputDto } from '../../dtos/cep-lookup.dto';
import { CepLookupViacepAdapterGateway } from './cep-lookup-viacep.gateway';
import { ViacepOutputDto } from './dtos/viacep.dto';

const API_URL = 'https://viacep.com.br/ws';
const CEP = '01001000';

const makeViacepResponse = (overrides: Partial<ViacepOutputDto> = {}): ViacepOutputDto => ({
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  unidade: '',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  estado: 'São Paulo',
  regiao: 'Sudeste',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
  ...overrides,
});

describe('CepLookupViacepAdapterGateway - Unit tests', () => {
  let sut: CepLookupViacepAdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeEach(async() => {
    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>({ viacepApiUrl: API_URL });
    httpService = createMock<HttpService>();

    const module = await Test.createTestingModule({
      providers: [
        CepLookupViacepAdapterGateway,
        { provide: TOKENS.LoggerGateway, useValue: logger },
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    sut = module.get(CepLookupViacepAdapterGateway);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('lookup', () => {
    describe('Happy path', () => {
      it('should return the port dto mapped from the viacep payload', async() => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse() });

        // Act
        const result = await sut.lookup(CEP);

        // Assert
        expect(result).toEqual<CepLookupOutputDto>({
          zipCode: '01001-000',
          street: 'Praça da Sé',
          complement: 'lado ímpar',
          neighborhood: 'Sé',
          city: 'São Paulo',
          state: 'SP',
        });
      });

      it.each([
        ['01001000', '01001000'],
        ['01001-000', '01001000'],
        ['01.001-000', '01001000'],
      ])('should request the viacep url with the normalized cep (%s)', async(input: string, expected: string) => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse() });

        // Act
        await sut.lookup(input);

        // Assert
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(`${API_URL}/${expected}/json/`);
      });
    });

    describe('Error path', () => {
      it.each([
        '1234567',
        '123456789',
        '12345ABC',
        'abc',
        '',
      ])('should throw ExternalApiError when the normalized cep does not have 8 digits (%s)', async(cep: string) => {
        // Act & Assert
        await expect(sut.lookup(cep)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(cep)).rejects.toThrow('CEP inválido');
      });

      it('should not call viacep nor the logger when the cep is invalid', async() => {
        // Act
        await sut.lookup('1234567').catch(() => undefined);

        // Assert
        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when viacep flags the cep as not found', async() => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse({ erro: true }) });

        // Act & Assert
        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');
      });

      it.each([
        undefined,
        '',
      ])('should throw ExternalApiError when viacep responds without the cep field (%s)', async(cep: any) => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse({ cep }) });

        // Act & Assert
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');
      });

      it.each([
        null,
        undefined,
        'invalid response',
      ])('should throw ExternalApiError when viacep responds with an unexpected payload (%s)', async(data: any) => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data });

        // Act & Assert
        await expect(sut.lookup(CEP)).rejects.toThrow('CEP não encontrado');
      });

      it('should log the not found failure with the viacep adapter context', async() => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse({ erro: true }) });

        // Act
        await sut.lookup(CEP).catch(() => undefined);

        // Assert
        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: expect.any(ExternalApiError),
        });
      });

      it('should throw ExternalApiError carrying the vendor message when the request rejects', async() => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(new Error('Network Error'));

        // Act & Assert
        await expect(sut.lookup(CEP)).rejects.toThrow(ExternalApiError);
        await expect(sut.lookup(CEP)).rejects.toThrow('Network Error');
      });

      it('should log the raw vendor error when the request rejects', async() => {
        // Arrange
        const failure = { response: { status: 500 }, message: 'Request failed with status code 500' };
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(failure);

        // Act
        await sut.lookup(CEP).catch(() => undefined);

        // Assert
        expect(logger.error).toHaveBeenCalledWith(LogContext.CEP_LOOKUP, {
          adapter: 'viacep',
          cep: CEP,
          error: failure,
        });
      });
    });

    describe('Edge cases', () => {
      it.each([
        '',
        '   ',
      ])('should map the complement to null when viacep returns it blank (%s)', async(complemento: string) => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: makeViacepResponse({ complemento }) });

        // Act
        const result = await sut.lookup(CEP);

        // Assert
        expect(result.complement).toBeNull();
      });

      it('should map the optional fields to empty strings when viacep omits them', async() => {
        // Arrange
        const data = makeViacepResponse({
          logradouro: undefined,
          complemento: undefined,
          bairro: undefined,
          localidade: undefined,
          uf: undefined,
        });
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data });

        // Act
        const result = await sut.lookup(CEP);

        // Assert
        expect(result).toEqual<CepLookupOutputDto>({
          zipCode: '01001-000',
          street: '',
          complement: null,
          neighborhood: '',
          city: '',
          state: '',
        });
      });

      it.each([
        null,
        undefined,
        {},
      ])('should throw ExternalApiError with the default message when the rejection has no message (%s)', async(failure: any) => {
        // Arrange
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(failure);

        // Act & Assert
        await expect(sut.lookup(CEP)).rejects.toThrow('Erro ao buscar CEP');
      });

      it.each([
        null,
        undefined,
      ])('should reject with a TypeError when the cep is %s', async(cep: any) => {
        // Act & Assert
        await expect(sut.lookup(cep)).rejects.toThrow(TypeError);
      });
    });
  });
});
