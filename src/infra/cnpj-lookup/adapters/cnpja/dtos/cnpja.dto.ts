export type CnpjaPhoneType = 'LANDLINE' | 'MOBILE';

export type CnpjaPersonType = 'LEGAL' | 'NATURAL' | 'FOREIGN' | 'UNKNOWN';

export class CnpjaCodeTextDto {
  id: number;
  text: string;
}

export class CnpjaCompanySizeDto {
  id: number;
  acronym: string;
  text: string;
}

export class CnpjaCountryDto {
  id: number;
  name: string;
}

export class CnpjaPersonDto {
  id: string;
  type: CnpjaPersonType;
  name: string;
  taxId?: string;
  age?: string;
  country?: CnpjaCountryDto;
}

export class CnpjaMemberAgentDto {
  person: CnpjaPersonDto;
  role: CnpjaCodeTextDto;
}

export class CnpjaMemberDto {
  since: string;
  person: CnpjaPersonDto;
  role: CnpjaCodeTextDto;
  agent?: CnpjaMemberAgentDto;
}

export class CnpjaOfficeCompanyDto {
  id: string;
  name: string;
  jurisdiction?: string;
  equity: number;
  nature: CnpjaCodeTextDto;
  size: CnpjaCompanySizeDto;
  members: CnpjaMemberDto[];
}

export class CnpjaAddressDto {
  municipality: number;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  details: string;
  zip: string;
  country: CnpjaCountryDto;
}

export class CnpjaPhoneDto {
  type: CnpjaPhoneType;
  area: string;
  number: string;
}

export class CnpjaEmailDto {
  ownership: string;
  address: string;
  domain: string;
}

export class CnpjaActivityDto {
  id: number;
  text: string;
}

export class CnpjaOfficeDto {
  taxId: string;
  updated: string;
  company: CnpjaOfficeCompanyDto;
  alias: string;
  founded: string;
  head: boolean;
  statusDate: string;
  status: CnpjaCodeTextDto;
  reason?: CnpjaCodeTextDto;
  specialDate?: string;
  special?: CnpjaCodeTextDto;
  address: CnpjaAddressDto;
  phones: CnpjaPhoneDto[];
  emails: CnpjaEmailDto[];
  mainActivity: CnpjaActivityDto;
  sideActivities: CnpjaActivityDto[];
}

export class CnpjaErrorDto {
  code: number;
  message: string;
}
