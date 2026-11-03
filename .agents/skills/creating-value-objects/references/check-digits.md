# Dígitos verificadores (CPF e CNPJ)

Leia este arquivo antes de criar `CPF`, `CNPJ` ou outro value object cujo invariante é dígito verificador.

Se `export class CPF` ou `export class CNPJ` já existir, importe pelo caminho real. Se não existir, crie a classe a partir do código abaixo. Proibido abrir outro `.vo.ts` para copiar o cálculo.

`InvalidCpfError` e `InvalidCnpjError`: skill `creating-custom-errors` (uma classe por arquivo, ao lado do VO).

## CPF

Módulo 11. Fonte do algoritmo: https://www.macoratti.net/alg_cpf.htm

```ts
import { InvalidCpfError } from './cpf.error';

export class CPF {
  private readonly LENGTH = 11;
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(rawCpf: string) {
    const cpf = this.sanitize(rawCpf);

    if (!this.validate(cpf)) {
      throw new InvalidCpfError(rawCpf);
    }
    this._value = cpf;
  }

  private sanitize(cpf: string): string {
    return typeof cpf === 'string' ? cpf.replace(/[\s./-]*/gim, '') : '';
  }

  private validate(cpf: string): boolean {
    if (!cpf) return false;
    if (cpf.length !== this.LENGTH) return false;
    if (this.allDigitsAreEqual(cpf)) return false;

    const firstDigit = this.calculateDigit(cpf, 9);
    if (firstDigit !== Number(cpf.substring(9, 10))) return false;

    const secondDigit = this.calculateDigit(cpf, 10);
    if (secondDigit !== Number(cpf.substring(10, 11))) return false;

    return true;
  }

  private allDigitsAreEqual(cpf: string): boolean {
    return cpf.split('').every((digit) => digit === cpf[0]);
  }

  private calculateDigit(cpf: string, length: number): number {
    // https://www.macoratti.net/alg_cpf.htm
    let sum = 0;
    let rest = 0;

    for (let i = 1; i <= length; i++) {
      sum += Number(cpf.substring(i - 1, i)) * (length + 2 - i);
    }
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;

    return rest;
  }
}
```

## CNPJ

CNPJ alfanumérico (Receita Federal, IN 2.229/2024, válido a partir de julho de 2026): as 12 primeiras posições são `[A-Z0-9]`, as 2 últimas são dígitos numéricos. Valor do caractere = código ASCII − 48. Fonte: https://www.serpro.gov.br/menu/noticias/videos/calculodvcnpjalfanaumerico.pdf

```ts
import { InvalidCnpjError } from './cnpj.error';

export class CNPJ {
  // Alphanumeric CNPJ (Receita Federal, IN 2.229/2024, valid from July 2026):
  // first 12 positions are alphanumeric [A-Z0-9], last 2 are numeric check digits.
  private readonly FORMAT = /^[A-Z0-9]{12}[0-9]{2}$/;
  private readonly ASCII_ZERO = 48;
  private readonly MULTIPLIES_FIRST_DIGIT = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  private readonly MULTIPLIES_SECOND_DIGIT = [6, ...this.MULTIPLIES_FIRST_DIGIT];
  private readonly _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(rawCnpj: string) {
    const cnpj = this.sanitize(rawCnpj);

    if (!this.validate(cnpj)) {
      throw new InvalidCnpjError(rawCnpj);
    }
    this._value = cnpj;
  }

  private sanitize(cnpj: string): string {
    return typeof cnpj === 'string' ? cnpj.replace(/[\s./-]/gim, '').toUpperCase() : '';
  }

  private validate(cnpj: string): boolean {
    if (!cnpj) return false;
    if (!this.FORMAT.test(cnpj)) return false;
    if (this.allCharsAreEqual(cnpj)) return false;

    const firstDigit = this.calculateDigit(cnpj, 12, this.MULTIPLIES_FIRST_DIGIT);
    if (firstDigit !== Number(cnpj[12])) return false;

    const secondDigit = this.calculateDigit(cnpj, 13, this.MULTIPLIES_SECOND_DIGIT);
    if (secondDigit !== Number(cnpj[13])) return false;

    return true;
  }

  private allCharsAreEqual(cnpj: string): boolean {
    return cnpj?.split('')?.every((char) => char === cnpj[0]);
  }

  private calculateDigit(cnpj: string, length: number, multipliers: number[]): number {
    // Module 11 over the char value = ASCII code - 48 (digits 0-9 -> 0-9, A-Z -> 17-42).
    // https://www.serpro.gov.br/menu/noticias/videos/calculodvcnpjalfanaumerico.pdf
    let sum = 0;
    let rest = 0;

    for (let i = 0; i < length; i++) {
      const value = cnpj.charCodeAt(i) - this.ASCII_ZERO;
      sum += value * multipliers[i];
    }

    rest = sum % 11;
    if (rest < 2) rest = 0;
    else rest = 11 - rest;

    return rest;
  }
}
```
