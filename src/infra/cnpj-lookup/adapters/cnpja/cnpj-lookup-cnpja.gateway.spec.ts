import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CnpjaOfficeDto } from './dtos/cnpja.dto';
import { CnpjLookupCnpjaAdapterGateway } from './cnpj-lookup-cnpja.gateway';

const makeCnpjaOffice = (overrides: Partial<CnpjaOfficeDto> = {}): CnpjaOfficeDto => ({
  taxId: '37335118000180',
  updated: '2024-06-05T17:52:39.136Z',
  alias: 'CNPJA',
  founded: '2020-06-05',
  head: true,
  statusDate: '2020-06-05',
  status: {
    id: 2,
    text: 'Ativa',
  },
  company: {
    id: '37335118',
    name: 'CNPJA TECNOLOGIA LTDA',
    equity: 1000,
    nature: {
      id: 2062,
      text: 'Sociedade Empresária Limitada',
    },
    size: {
      id: 1,
      acronym: 'ME',
      text: 'Microempresa',
    },
    members: [
      {
        since: '2020-06-05',
        person: {
          id: 'person-1',
          type: 'NATURAL',
          name: 'João Silva',
          taxId: '***123456**',
          age: '31-40',
        },
        role: {
          id: 49,
          text: 'Sócio-Administrador',
        },
      },
    ],
  },
  address: {
    municipality: 3550308,
    street: 'Avenida Brigadeiro Faria Lima',
    number: '2369',
    district: 'Jardim Paulistano',
    city: 'São Paulo',
    state: 'SP',
    details: 'Conj 1102',
    zip: '01452922',
    country: {
      id: 76,
      name: 'Brasil',
    },
  },
  phones: [
    {
      type: 'MOBILE',
      area: '11',
      number: '971564144',
    },
  ],
  emails: [
    {
      ownership: 'ACCOUNTING',
      address: 'contato@cnpja.com',
      domain: 'cnpja.com',
    },
  ],
  mainActivity: {
    id: 6311900,
    text: 'Tratamento de dados',
  },
  sideActivities: [
    {
      id: 6201501,
      text: 'Desenvolvimento de software',
    },
  ],
  ...overrides,
});

describe('CnpjLookupCnpjaAdapterGateway - Unit tests', () => {
  let sut: CnpjLookupCnpjaAdapterGateway;
  let logger: ILoggerGateway;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeEach(async() => {
    logger = createMock<ILoggerGateway>();
    configService = createMock<ConfigService>({
      cnpjaApiUrl: 'https://api.cnpja.com',
      cnpjaApiKey: 'test-api-key',
    });
    httpService = createMock<HttpService>({
      axiosRef: {
        get: jest.fn(),
      } as any,
    });

    const module = await Test.createTestingModule({
      providers: [
        CnpjLookupCnpjaAdapterGateway,
        { provide: TOKENS.LoggerGateway, useValue: logger },
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    sut = module.get(CnpjLookupCnpjaAdapterGateway);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('lookup', () => {
    describe('Happy path', () => {
      it('should return the port dto mapped from the cnpja office response', async() => {
        // Arrange
        const office = makeCnpjaOffice();
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        const result = await sut.lookup('37335118000180');

        // Assert
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(
          'https://api.cnpja.com/office/37335118000180',
          {
            headers: {
              Authorization: 'test-api-key',
            },
          },
        );
        expect(result).toEqual({
          cnpj: '37335118000180',
          updatedAt: '2024-06-05T17:52:39.136Z',
          tradeName: 'CNPJA',
          foundedAt: '2020-06-05',
          isHeadquarters: true,
          statusAt: '2020-06-05',
          status: {
            code: 2,
            description: 'Ativa',
          },
          reason: null,
          specialAt: null,
          special: null,
          company: {
            id: '37335118',
            legalName: 'CNPJA TECNOLOGIA LTDA',
            jurisdiction: null,
            shareCapital: 1000,
            nature: {
              code: 2062,
              description: 'Sociedade Empresária Limitada',
            },
            size: {
              code: 1,
              acronym: 'ME',
              description: 'Microempresa',
            },
            partners: [
              {
                since: '2020-06-05',
                person: {
                  id: 'person-1',
                  type: 'natural',
                  name: 'João Silva',
                  taxId: '***123456**',
                  age: '31-40',
                  country: null,
                },
                role: {
                  code: 49,
                  description: 'Sócio-Administrador',
                },
                agent: null,
              },
            ],
          },
          address: {
            ibgeCityCode: 3550308,
            street: 'Avenida Brigadeiro Faria Lima',
            number: '2369',
            neighborhood: 'Jardim Paulistano',
            city: 'São Paulo',
            state: 'SP',
            complement: 'Conj 1102',
            zipCode: '01452922',
            country: {
              code: 76,
              name: 'Brasil',
            },
          },
          phones: [
            {
              type: 'mobile',
              area: '11',
              number: '971564144',
            },
          ],
          emails: [
            {
              ownership: 'ACCOUNTING',
              address: 'contato@cnpja.com',
              domain: 'cnpja.com',
            },
          ],
          mainActivity: {
            code: 6311900,
            description: 'Tratamento de dados',
          },
          sideActivities: [
            {
              code: 6201501,
              description: 'Desenvolvimento de software',
            },
          ],
        });
      });

      it('should map optional reason, special, jurisdiction and partner agent when present', async() => {
        // Arrange
        const office = makeCnpjaOffice({
          reason: {
            id: 1,
            text: 'Extinção',
          },
          specialDate: '2022-01-01',
          special: {
            id: 416,
            text: 'Início de Liquidação Judicial',
          },
          company: {
            id: '37335118',
            name: 'CNPJA TECNOLOGIA LTDA',
            jurisdiction: 'Uniao',
            equity: 1000,
            nature: {
              id: 2062,
              text: 'Sociedade Empresária Limitada',
            },
            size: {
              id: 1,
              acronym: 'ME',
              text: 'Microempresa',
            },
            members: [
              {
                since: '2020-06-05',
                person: {
                  id: 'person-1',
                  type: 'LEGAL',
                  name: 'Empresa Sócia LTDA',
                  taxId: '11222333000181',
                },
                role: {
                  id: 22,
                  text: 'Sócio',
                },
                agent: {
                  person: {
                    id: 'agent-1',
                    type: 'FOREIGN',
                    name: 'Agent Name',
                    country: {
                      id: 840,
                      name: 'Estados Unidos',
                    },
                  },
                  role: {
                    id: 5,
                    text: 'Administrador',
                  },
                },
              },
            ],
          },
          phones: [
            {
              type: 'LANDLINE',
              area: '11',
              number: '30030000',
            },
          ],
        });
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        const result = await sut.lookup('37335118000180');

        // Assert
        expect(result.reason).toEqual({
          code: 1,
          description: 'Extinção',
        });
        expect(result.specialAt).toBe('2022-01-01');
        expect(result.special).toEqual({
          code: 416,
          description: 'Início de Liquidação Judicial',
        });
        expect(result.company.jurisdiction).toBe('Uniao');
        expect(result.company.partners[0].person.type).toBe('legal');
        expect(result.company.partners[0].agent).toEqual({
          person: {
            id: 'agent-1',
            type: 'foreign',
            name: 'Agent Name',
            taxId: null,
            age: null,
            country: {
              code: 840,
              name: 'Estados Unidos',
            },
          },
          role: {
            code: 5,
            description: 'Administrador',
          },
        });
        expect(result.phones[0].type).toBe('landline');
      });
    });

    describe('Error path', () => {
      it.each([
        '',
        '123',
        '3733511800018',
        '373351180001801',
      ])('should throw ExternalApiError when cnpj length is invalid after sanitize (%s)', async(cnpj: string) => {
        // Act & Assert
        await expect(sut.lookup(cnpj)).rejects.toThrow(new ExternalApiError('CNPJ inválido'));
        expect(httpService.axiosRef.get).not.toHaveBeenCalled();
      });

      it('should throw ExternalApiError when cnpja returns 404', async() => {
        // Arrange
        const error = {
          response: {
            status: 404,
            data: {
              code: 404,
              message: 'tax id not registered at revenue service',
            },
          },
        };
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(error);

        // Act & Assert
        await expect(sut.lookup('37335118000180')).rejects.toThrow(
          new ExternalApiError('CNPJ não encontrado'),
        );
        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: '37335118000180',
          error,
        });
      });

      it('should throw ExternalApiError with vendor message when cnpja rejects with response data', async() => {
        // Arrange
        const error = {
          response: {
            status: 401,
            data: {
              code: 401,
              message: 'invalid authentication',
            },
          },
        };
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(error);

        // Act & Assert
        await expect(sut.lookup('37335118000180')).rejects.toThrow(
          new ExternalApiError('invalid authentication'),
        );
        expect(logger.error).toHaveBeenCalledWith(LogContext.CNPJ_LOOKUP, {
          adapter: 'cnpja',
          cnpj: '37335118000180',
          error,
        });
      });

      it('should throw ExternalApiError with error message when response data message is missing', async() => {
        // Arrange
        const error = new Error('network down');
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(error);

        // Act & Assert
        await expect(sut.lookup('37335118000180')).rejects.toThrow(
          new ExternalApiError('network down'),
        );
      });

      it('should throw ExternalApiError with fallback message when error has no message', async() => {
        // Arrange
        const error = {};
        jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(error);

        // Act & Assert
        await expect(sut.lookup('37335118000180')).rejects.toThrow(
          new ExternalApiError('Erro ao consultar CNPJ'),
        );
      });
    });

    describe('Edge cases', () => {
      it('should sanitize masked cnpj before calling cnpja', async() => {
        // Arrange
        const office = makeCnpjaOffice();
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        await sut.lookup('37.335.118/0001-80');

        // Assert
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(
          'https://api.cnpja.com/office/37335118000180',
          {
            headers: {
              Authorization: 'test-api-key',
            },
          },
        );
      });

      it('should uppercase alphanumeric cnpj before calling cnpja', async() => {
        // Arrange
        const office = makeCnpjaOffice({ taxId: 'ABCDEFGHIJKL90' });
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        const result = await sut.lookup('abcdefghijkl90');

        // Assert
        expect(httpService.axiosRef.get).toHaveBeenCalledWith(
          'https://api.cnpja.com/office/ABCDEFGHIJKL90',
          {
            headers: {
              Authorization: 'test-api-key',
            },
          },
        );
        expect(result.cnpj).toBe('ABCDEFGHIJKL90');
      });

      it('should map empty address details to empty complement', async() => {
        // Arrange
        const office = makeCnpjaOffice({
          address: {
            municipality: 3550308,
            street: 'Rua A',
            number: '1',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            details: '   ',
            zip: '01001000',
            country: {
              id: 76,
              name: 'Brasil',
            },
          },
        });
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        const result = await sut.lookup('37335118000180');

        // Assert
        expect(result.address.complement).toBe('');
      });

      it('should map unknown person type and empty collections when vendor omits lists', async() => {
        // Arrange
        const office = makeCnpjaOffice({
          company: {
            id: '37335118',
            name: 'CNPJA TECNOLOGIA LTDA',
            equity: 1000,
            nature: {
              id: 2062,
              text: 'Sociedade Empresária Limitada',
            },
            size: {
              id: 1,
              acronym: 'ME',
              text: 'Microempresa',
            },
            members: [
              {
                since: '2020-06-05',
                person: {
                  id: 'person-unknown',
                  type: 'UNKNOWN',
                  name: 'Desconhecido',
                },
                role: {
                  id: 1,
                  text: 'Sócio',
                },
              },
            ],
          },
          phones: undefined as any,
          emails: undefined as any,
          sideActivities: undefined as any,
        });
        jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: office });

        // Act
        const result = await sut.lookup('37335118000180');

        // Assert
        expect(result.company.partners[0].person.type).toBe('unknown');
        expect(result.phones).toEqual([]);
        expect(result.emails).toEqual([]);
        expect(result.sideActivities).toEqual([]);
      });
    });
  });
});
