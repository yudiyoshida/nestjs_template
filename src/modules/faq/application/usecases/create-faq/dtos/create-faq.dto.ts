import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/decorators/trim';

export class CreateFaqInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  question: string;

  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  answer: string;
}

export class CreateFaqOutputDto {
  id: string;
}
