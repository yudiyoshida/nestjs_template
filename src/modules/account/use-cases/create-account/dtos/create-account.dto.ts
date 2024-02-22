import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Trim } from 'src/shared/validators/decorators/trim';

export class CreateAccountDto {
  @IsString({
    message: 'Nome deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'Nome é um campo obrigatório.',
  })
  @Trim()
  name: string;

  @IsEmail({}, {
    message: 'Email inválido.',
  })
  @IsNotEmpty({
    message: 'Email é um campo obrigatório.',
  })
  @Trim()
  email: string;

  @IsString({
    message: 'Senha deve ser do tipo string.',
  })
  @IsNotEmpty({
    message: 'Senha é um campo obrigatório.',
  })
  @MinLength(8, {
    message: 'Senha deve conter, no mínimo, 8 caracteres.',
  })
  @Trim()
  password: string;
}
