import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';
import { TipCannotBeEditedError } from '../errors/tip-cannot-be-edited.error';

export type TipProps = TipCreateProps & {
  id: string;
  type: TipType;
  status: TipStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TipCreateProps = {
  title: string;
  content: string;
  locationId: string | null;
  createdBy: string;
};

export class Tip {
  private readonly _props: TipProps;

  static _instantiate(props: TipProps): Tip {
    return new Tip(props);
  }

  private constructor(props: TipProps) {
    this._props = props;
  }

  public get props(): Readonly<TipProps> {
    return { ...this._props };
  }

  public isWeather(): boolean {
    return this._props.type === TipType.WEATHER;
  }

  public isLocal(): boolean {
    return this._props.type === TipType.LOCAL;
  }

  public isActive(): boolean {
    return this._props.status === TipStatus.ACTIVE;
  }

  public isExpired(): boolean {
    return this._props.status === TipStatus.EXPIRED;
  }

  public isRemoved(): boolean {
    return this._props.status === TipStatus.REMOVED;
  }

  public hasExpired(): boolean {
    if (!this._props.expiresAt) return false;

    const expirationDate = UTCDate.from(this._props.expiresAt);
    const now = UTCDate.create();

    return now.isAfter(expirationDate);
  }

  public expire(): void {
    this._props.status = TipStatus.EXPIRED;
    this._props.updatedAt = UTCDate.create().value;
  }

  public remove(): void {
    this._props.status = TipStatus.REMOVED;
    this._props.updatedAt = UTCDate.create().value;
  }

  public update(props: Partial<Pick<TipCreateProps, 'title' | 'content'>>): void {
    if (!this.isActive()) {
      throw new TipCannotBeEditedError();
    }

    this._props.title = props.title ?? this._props.title;
    this._props.content = props.content ?? this._props.content;
    this._props.updatedAt = UTCDate.create().value;
  }
}
