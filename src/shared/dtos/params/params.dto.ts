import { IsNotEmpty, IsString } from 'class-validator';

export class Params {
  @IsString({
    message: 'id deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'id é um campo obrigatório.',
  })
  id: string;
}
