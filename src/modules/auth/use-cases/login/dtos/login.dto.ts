import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/shared/validators/decorators/trim';

export class LoginDto {
  @IsString({
    message: 'Campo email deve ser do tipo string.',
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
  @Trim()
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
}
