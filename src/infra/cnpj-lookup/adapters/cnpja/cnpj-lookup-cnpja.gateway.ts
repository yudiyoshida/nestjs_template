import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import type { AxiosError } from 'axios';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { ICnpjLookupGateway } from '../../cnpj-lookup.gateway';
import {
  CnpjLookupActivityDto,
  CnpjLookupAddressDto,
  CnpjLookupCodeDescriptionDto,
  CnpjLookupCompanyDto,
  CnpjLookupCompanySizeDto,
  CnpjLookupCountryDto,
  CnpjLookupEmailDto,
  CnpjLookupOutputDto,
  CnpjLookupPartnerAgentDto,
  CnpjLookupPartnerDto,
  CnpjLookupPersonDto,
  CnpjLookupPersonType,
  CnpjLookupPhoneDto,
  CnpjLookupPhoneType,
} from '../../dtos/cnpj-lookup.dto';
import {
  CnpjaActivityDto,
  CnpjaAddressDto,
  CnpjaCodeTextDto,
  CnpjaCompanySizeDto,
  CnpjaCountryDto,
  CnpjaEmailDto,
  CnpjaErrorDto,
  CnpjaMemberAgentDto,
  CnpjaMemberDto,
  CnpjaOfficeCompanyDto,
  CnpjaOfficeDto,
  CnpjaPersonDto,
  CnpjaPersonType,
  CnpjaPhoneDto,
  CnpjaPhoneType,
} from './dtos/cnpja.dto';

@Injectable()
export class CnpjLookupCnpjaAdapterGateway implements ICnpjLookupGateway {
  private readonly CNPJ_LENGTH = 14;
  private readonly NOT_FOUND_STATUS = 404;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  public async lookup(cnpj: string): Promise<CnpjLookupOutputDto> {
    const normalizedCnpj = this.toVendorCnpj(cnpj);
    if (normalizedCnpj.length !== this.CNPJ_LENGTH) {
      throw new ExternalApiError('CNPJ inválido');
    }

    try {
      const result = await this.httpService.axiosRef.get<CnpjaOfficeDto>(
        `${this.configService.cnpjaApiUrl}/office/${normalizedCnpj}`,
        {
          headers: {
            Authorization: this.configService.cnpjaApiKey,
          },
        },
      );

      return this.toPort(result.data);
    }
    catch (error) {
      this.logger.error(LogContext.CNPJ_LOOKUP, {
        adapter: 'cnpja',
        cnpj: normalizedCnpj,
        error,
      });

      throw this.toPortError(error as AxiosError<CnpjaErrorDto>);
    }
  }

  private toPortError(error: AxiosError<CnpjaErrorDto>): ExternalApiError {
    if (error?.response?.status === this.NOT_FOUND_STATUS) {
      return new ExternalApiError('CNPJ não encontrado');
    }

    return new ExternalApiError(
      error?.response?.data?.message ?? error?.message ?? 'Erro ao consultar CNPJ',
    );
  }

  private toVendorCnpj(cnpj: string): string {
    return cnpj?.replace(/[\s./-]/gim, '')?.toUpperCase() ?? '';
  }

  private toPort(data: CnpjaOfficeDto): CnpjLookupOutputDto {
    return {
      cnpj: data.taxId,
      updatedAt: data.updated,
      tradeName: data.alias,
      foundedAt: data.founded,
      isHeadquarters: data.head,
      statusAt: data.statusDate,
      status: this.toCodeDescription(data.status),
      reason: data.reason ? this.toCodeDescription(data.reason) : null,
      specialAt: data.specialDate ?? null,
      special: data.special ? this.toCodeDescription(data.special) : null,
      company: this.toCompany(data.company),
      address: this.toAddress(data.address),
      phones: (data.phones ?? []).map((phone) => this.toPhone(phone)),
      emails: (data.emails ?? []).map((email) => this.toEmail(email)),
      mainActivity: this.toActivity(data.mainActivity),
      sideActivities: (data.sideActivities ?? []).map((activity) => this.toActivity(activity)),
    };
  }

  private toCodeDescription(data: CnpjaCodeTextDto): CnpjLookupCodeDescriptionDto {
    return {
      code: data.id,
      description: data.text,
    };
  }

  private toCompanySize(data: CnpjaCompanySizeDto): CnpjLookupCompanySizeDto {
    return {
      code: data.id,
      acronym: data.acronym,
      description: data.text,
    };
  }

  private toCountry(data: CnpjaCountryDto): CnpjLookupCountryDto {
    return {
      code: data.id,
      name: data.name,
    };
  }

  private toPersonType(type: CnpjaPersonType): CnpjLookupPersonType {
    const map: Record<CnpjaPersonType, CnpjLookupPersonType> = {
      NATURAL: 'natural',
      LEGAL: 'legal',
      FOREIGN: 'foreign',
      UNKNOWN: 'unknown',
    };

    return map[type];
  }

  private toPerson(data: CnpjaPersonDto): CnpjLookupPersonDto {
    return {
      id: data.id,
      type: this.toPersonType(data.type),
      name: data.name,
      taxId: data.taxId ?? null,
      age: data.age ?? null,
      country: data.country ? this.toCountry(data.country) : null,
    };
  }

  private toPartnerAgent(data: CnpjaMemberAgentDto): CnpjLookupPartnerAgentDto {
    return {
      person: this.toPerson(data.person),
      role: this.toCodeDescription(data.role),
    };
  }

  private toPartner(data: CnpjaMemberDto): CnpjLookupPartnerDto {
    return {
      since: data.since,
      person: this.toPerson(data.person),
      role: this.toCodeDescription(data.role),
      agent: data.agent ? this.toPartnerAgent(data.agent) : null,
    };
  }

  private toCompany(data: CnpjaOfficeCompanyDto): CnpjLookupCompanyDto {
    return {
      id: data.id,
      legalName: data.name,
      jurisdiction: data.jurisdiction ?? null,
      shareCapital: data.equity,
      nature: this.toCodeDescription(data.nature),
      size: this.toCompanySize(data.size),
      partners: (data.members ?? []).map((member) => this.toPartner(member)),
    };
  }

  private toAddress(data: CnpjaAddressDto): CnpjLookupAddressDto {
    return {
      ibgeCityCode: data.municipality,
      street: data.street,
      number: data.number,
      neighborhood: data.district,
      city: data.city,
      state: data.state,
      complement: data.details?.trim() || '',
      zipCode: data.zip,
      country: this.toCountry(data.country),
    };
  }

  private toPhoneType(type: CnpjaPhoneType): CnpjLookupPhoneType {
    const map: Record<CnpjaPhoneType, CnpjLookupPhoneType> = {
      LANDLINE: 'landline',
      MOBILE: 'mobile',
    };

    return map[type];
  }

  private toPhone(data: CnpjaPhoneDto): CnpjLookupPhoneDto {
    return {
      type: this.toPhoneType(data.type),
      area: data.area,
      number: data.number,
    };
  }

  private toEmail(data: CnpjaEmailDto): CnpjLookupEmailDto {
    return {
      ownership: data.ownership,
      address: data.address,
      domain: data.domain,
    };
  }

  private toActivity(data: CnpjaActivityDto): CnpjLookupActivityDto {
    return {
      code: data.id,
      description: data.text,
    };
  }
}
