import { TipStatus } from '../../domain/enums/tip-status.enum';
import { TipType } from '../../domain/enums/tip-type.enum';

export class TipDto {
  id: string;
  type: TipType;
  title: string;
  content: string;
  status: TipStatus;
  locationId: string | null;
  createdBy: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
