// upload file
export const UploadFileVendor = {
  Fake: 'fake',
  AwsS3: 'aws-s3',
} as const;

export type UploadFileVendor = (typeof UploadFileVendor)[keyof typeof UploadFileVendor];
export const UPLOAD_FILE_VENDORS = Object.values(UploadFileVendor);

export function isUploadFileVendor(value: string | undefined): value is UploadFileVendor {
  return (UPLOAD_FILE_VENDORS as readonly string[]).includes(value ?? '');
}

// smtp
export const SmtpVendor = {
  Fake: 'fake',
  Nodemailer: 'nodemailer',
} as const;

export type SmtpVendor = (typeof SmtpVendor)[keyof typeof SmtpVendor];
export const SMTP_VENDORS = Object.values(SmtpVendor);

export function isSmtpVendor(value: string | undefined): value is SmtpVendor {
  return (SMTP_VENDORS as readonly string[]).includes(value ?? '');
}

// cache
export const CacheVendor = {
  Fake: 'fake',
  Redis: 'redis',
} as const;

export type CacheVendor = (typeof CacheVendor)[keyof typeof CacheVendor];
export const CACHE_VENDORS = Object.values(CacheVendor);

export function isCacheVendor(value: string | undefined): value is CacheVendor {
  return (CACHE_VENDORS as readonly string[]).includes(value ?? '');
}

// cep lookup
export const CepLookupVendor = {
  Fake: 'fake',
  Viacep: 'viacep',
} as const;

export type CepLookupVendor = (typeof CepLookupVendor)[keyof typeof CepLookupVendor];
export const CEP_LOOKUP_VENDORS = Object.values(CepLookupVendor);

export function isCepLookupVendor(value: string | undefined): value is CepLookupVendor {
  return (CEP_LOOKUP_VENDORS as readonly string[]).includes(value ?? '');
}

// cnpj lookup
export const CnpjLookupVendor = {
  Fake: 'fake',
  Cnpja: 'cnpja',
} as const;

export type CnpjLookupVendor = (typeof CnpjLookupVendor)[keyof typeof CnpjLookupVendor];
export const CNPJ_LOOKUP_VENDORS = Object.values(CnpjLookupVendor);

export function isCnpjLookupVendor(value: string | undefined): value is CnpjLookupVendor {
  return (CNPJ_LOOKUP_VENDORS as readonly string[]).includes(value ?? '');
}

// logger
export const LoggerVendor = {
  Fake: 'fake',
  Winston: 'winston',
} as const;

export type LoggerVendor = (typeof LoggerVendor)[keyof typeof LoggerVendor];
export const LOGGER_VENDORS = Object.values(LoggerVendor);

export function isLoggerVendor(value: string | undefined): value is LoggerVendor {
  return (LOGGER_VENDORS as readonly string[]).includes(value ?? '');
}
