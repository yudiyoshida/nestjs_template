import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Swagger } from 'src/shared/decorators/swagger';
import { LoginDto, LoginResponseDto } from './dtos/login.dto';
import { LoginService } from './login.service';

@Controller()
export class LoginController {
  constructor(private loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Rota utilizada para realizar login',
    okResponse: LoginResponseDto,
    applyBadRequest: true,
  })
  public handle(@Body() data: LoginDto) {
    return this.loginService.execute(data);
  }
}
