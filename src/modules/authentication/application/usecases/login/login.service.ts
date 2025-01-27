import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';
import { Errors } from 'src/shared/errors/message';
import { AuthenticationDao } from '../../../infra/persistence/authentication.dao';
import { JwtAuthService } from '../../services/jwt/jwt.service';
import { PasswordService } from '../../services/password/password.service';
import { LoginInputDto, LoginOutputDto } from './dtos/login.dto';

@Injectable()
export class LoginService {
  constructor(
    private authenticationDao: AuthenticationDao,
    private passwordService: PasswordService,
    private jwtService: JwtAuthService,
  ) {}

  async execute(data: LoginInputDto): Promise<LoginOutputDto> {
    const account = await this.authenticationDao.findByCredential(data.credential);

    if (!account) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    const isMatch = this.passwordService.compare(data.password, account.password);
    if (!isMatch) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    if (account.status === AccountStatus.INACTIVE) {
      throw new ForbiddenException(Errors.ACCOUNT_INACTIVE);
    }

    return { accessToken: this.jwtService.generateToken(account) };
  }
}
