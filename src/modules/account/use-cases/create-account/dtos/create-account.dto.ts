import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Trim } from 'src/shared/validators/decorators/trim';

export class CreateAccountDto {
  @IsString({
    message: 'Campo nome deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'Campo nome é um campo obrigatório.',
  })
  @Trim()
  name: string;

  @IsEmail({}, {
    message: 'Campo email inválido.',
  })
  @IsNotEmpty({
    message: 'Campo email é um campo obrigatório.',
  })
  @Trim()
  email: string;

  @IsString({
    message: 'Campo senha deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'Campo senha é um campo obrigatório.',
  })
  @MinLength(8, {
    message: 'Campo senha deve conter, no mínimo, 8 caracteres.',
  })
  @Trim()
  password: string;
}
