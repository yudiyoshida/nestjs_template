import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../decorators/trim';

export class Params {
  @IsString({ message: '$property deve ser do tipo texto' })
  @IsNotEmpty({ message: '$property é um campo obrigatório' })
  @Trim()
  id: string;
}
