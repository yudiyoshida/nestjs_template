import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/shared/validators/decorators/trim';

export class LoginDto {
  @IsString({
    message: 'Email deve ser do tipo string.',
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
  @Trim()
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
}
