import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Swagger } from 'src/infra/openapi/swagger';
import { LoginInputDto, LoginOutputDto } from '../../application/usecases/login/dtos/login.dto';
import { LoginService } from '../../application/usecases/login/login.service';

@Controller('auth')
export class AuthenticationController {
  constructor(private loginService: LoginService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Autenticação'],
    summary: 'Rota para autenticar um usuário',
    applyBadRequest: true,
    okResponse: LoginOutputDto,
  })
  public login(@Body() body: LoginInputDto): Promise<LoginOutputDto> {
    return this.loginService.execute(body);
  }
}
