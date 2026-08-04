import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';
import { TipCannotBeExpiredError } from '../errors/tip-cannot-be-expired.error';
import { TipCannotBeRemovedError } from '../errors/tip-cannot-be-removed.error';

export type TipProps = TipCreateProps & {
  id: string;
  type: TipType;
  status: TipStatus;
  expiresAt: Date | null;
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

  public canBeEdited(): boolean {
    return this.isActive();
  }

  public expire(): void {
    if (!this.isActive()) {
      throw new TipCannotBeExpiredError();
    }
    this._props.status = TipStatus.EXPIRED;
  }

  public remove(): void {
    if (!this.isActive()) {
      throw new TipCannotBeRemovedError();
    }
    this._props.status = TipStatus.REMOVED;
  }
}
