import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/infra/validators/decorators/trim';

export class EditTextInputDto {
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @Trim()
  content: string;
}
