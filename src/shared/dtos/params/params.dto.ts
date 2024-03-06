import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/shared/validators/decorators/trim';

export class Params {
  @IsString({
    message: 'id deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'id é um campo obrigatório.',
  })
  @Trim()
  id: string;
}
