import { Injectable } from '@nestjs/common';
import { ICnpjLookupGateway } from '../../cnpj-lookup.gateway';
import { CnpjLookupOutputDto } from '../../dtos/cnpj-lookup.dto';

@Injectable()
export class CnpjLookupFakeAdapterGateway implements ICnpjLookupGateway {
  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    return {
      cnpj,
      updatedAt: '2024-01-01T00:00:00.000Z',
      tradeName: cnpj,
      foundedAt: '2020-01-01',
      isHeadquarters: true,
      statusAt: '2020-01-01',
      status: {
        code: 2,
        description: 'Ativa',
      },
      reason: null,
      specialAt: null,
      special: null,
      company: {
        id: cnpj.slice(0, 8),
        legalName: cnpj,
        jurisdiction: null,
        shareCapital: 0,
        nature: {
          code: 2062,
          description: cnpj,
        },
        size: {
          code: 1,
          acronym: 'ME',
          description: 'Microempresa',
        },
        partners: [],
      },
      address: {
        ibgeCityCode: 0,
        street: cnpj,
        number: '0',
        neighborhood: cnpj,
        city: cnpj,
        state: 'SP',
        complement: '',
        zipCode: '00000000',
        country: {
          code: 76,
          name: 'Brasil',
        },
      },
      phones: [],
      emails: [],
      mainActivity: {
        code: 0,
        description: cnpj,
      },
      sideActivities: [],
    };
  }
}
