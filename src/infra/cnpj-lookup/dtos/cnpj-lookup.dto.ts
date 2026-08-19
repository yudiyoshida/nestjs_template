export type CnpjLookupPhoneType = 'landline' | 'mobile';

export type CnpjLookupPersonType = 'natural' | 'legal' | 'foreign' | 'unknown';

export class CnpjLookupCodeDescriptionDto {
  code: number;
  description: string;
}

export class CnpjLookupCompanySizeDto {
  code: number;
  acronym: string;
  description: string;
}

export class CnpjLookupCountryDto {
  code: number;
  name: string;
}

export class CnpjLookupPersonDto {
  id: string;
  type: CnpjLookupPersonType;
  name: string;
  taxId: string | null;
  age: string | null;
  country: CnpjLookupCountryDto | null;
}

export class CnpjLookupPartnerAgentDto {
  person: CnpjLookupPersonDto;
  role: CnpjLookupCodeDescriptionDto;
}

export class CnpjLookupPartnerDto {
  since: string;
  person: CnpjLookupPersonDto;
  role: CnpjLookupCodeDescriptionDto;
  agent: CnpjLookupPartnerAgentDto | null;
}

export class CnpjLookupCompanyDto {
  id: string;
  legalName: string;
  jurisdiction: string | null;
  shareCapital: number;
  nature: CnpjLookupCodeDescriptionDto;
  size: CnpjLookupCompanySizeDto;
  partners: CnpjLookupPartnerDto[];
}

export class CnpjLookupAddressDto {
  ibgeCityCode: number;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  zipCode: string;
  country: CnpjLookupCountryDto;
}

export class CnpjLookupPhoneDto {
  type: CnpjLookupPhoneType;
  area: string;
  number: string;
}

export class CnpjLookupEmailDto {
  ownership: string;
  address: string;
  domain: string;
}

export class CnpjLookupActivityDto {
  code: number;
  description: string;
}

export class CnpjLookupOutputDto {
  cnpj: string;
  updatedAt: string;
  tradeName: string;
  foundedAt: string;
  isHeadquarters: boolean;
  statusAt: string;
  status: CnpjLookupCodeDescriptionDto;
  reason: CnpjLookupCodeDescriptionDto | null;
  specialAt: string | null;
  special: CnpjLookupCodeDescriptionDto | null;
  company: CnpjLookupCompanyDto;
  address: CnpjLookupAddressDto;
  phones: CnpjLookupPhoneDto[];
  emails: CnpjLookupEmailDto[];
  mainActivity: CnpjLookupActivityDto;
  sideActivities: CnpjLookupActivityDto[];
}
