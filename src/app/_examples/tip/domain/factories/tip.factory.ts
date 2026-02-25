import { AppException } from 'src/core/filters/app.exception';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { Tip, TipCreateProps, TipProps } from '../entities/tip.entity';
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';

export class TipFactory {
  private static validateCreateProps(props: TipCreateProps) {
    if (typeof props.title !== 'string' || !props.title || !props.title.trim()) {
      throw new AppException('O campo title não pode ser vazio');
    }
    if (typeof props.content !== 'string' || !props.content || !props.content.trim()) {
      throw new AppException('O campo content não pode ser vazio');
    }
  }

  static createWeather(props: TipCreateProps): Tip {
    this.validateCreateProps(props);

    const now = UTCDate.create();
    const expiresAt = now.addDays(1);

    return Tip._instantiate({
      ...props,
      id: new UUID().value,
      type: TipType.WEATHER,
      status: TipStatus.ACTIVE,
      expiresAt: expiresAt.value,
    });
  }

  static createLocal(props: TipCreateProps): Tip {
    this.validateCreateProps(props);

    if (!props.locationId) {
      throw new AppException('Location ID is required for local tips.');
    }

    return Tip._instantiate({
      ...props,
      id: new UUID().value,
      type: TipType.LOCAL,
      status: TipStatus.ACTIVE,
      expiresAt: null,
    });
  }

  static load(props: TipProps): Tip {
    return Tip._instantiate(props);
  }
}
