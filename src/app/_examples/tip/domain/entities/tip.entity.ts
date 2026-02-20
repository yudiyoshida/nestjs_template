import { AppException } from 'src/core/filters/app.exception';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';
import { TipCannotBeEditedError } from '../errors/tip.error';

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

  static createWeather(props: TipCreateProps): Tip {
    const now = UTCDate.create();
    const expiresAt = now.addDays(1);

    return new Tip({
      ...props,
      id: new UUID().value,
      type: TipType.WEATHER,
      status: TipStatus.ACTIVE,
      expiresAt: expiresAt.value,
      createdAt: now.value,
      updatedAt: now.value,
    });
  }

  static createLocal(props: TipCreateProps): Tip {
    if (!props.locationId) {
      throw new AppException('Location ID is required for local tips.');
    }

    const now = UTCDate.create().value;

    return new Tip({
      ...props,
      id: new UUID().value,
      type: TipType.LOCAL,
      status: TipStatus.ACTIVE,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(props: TipProps): Tip {
    return new Tip(props);
  }

  constructor(props: TipProps) {
    this._props = {
      id: props.id,
      type: props.type,
      status: props.status,
      title: props.title,
      content: props.content,
      locationId: props.locationId,
      createdBy: props.createdBy,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
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
    return UTCDate.create().isAfter(expirationDate);
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
