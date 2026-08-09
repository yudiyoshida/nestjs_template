export class UUID {
  private readonly _value: string;

  constructor() {
    this._value = this.generateUUID();
  }

  public get value(): string {
    return this._value;
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
