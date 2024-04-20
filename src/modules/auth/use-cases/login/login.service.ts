import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IHashingService } from 'src/infra/hashing/hashing.interface';
import { GetAccountByEmailService } from 'src/modules/account/use-cases/get-account-by-email/get-account-by-email.service';
import { Errors } from 'src/shared/errors/error-message';
import { TOKENS } from 'src/shared/ioc/tokens';
import { PayloadDto } from '../../types/payload.type';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class LoginService {
  constructor(
    @Inject(TOKENS.IHashingService) private hashingService: IHashingService,
    private getAccountByEmailService: GetAccountByEmailService,
    private jwtService: JwtService
  ) {}

  public async execute(credentials: LoginDto) {
    const account = await this.getAccountByEmailService.execute(credentials.email);
    if (!account) {
      throw new BadRequestException(Errors.INCORRECT_CREDENTIALS);
    }

    const isPasswordCorrect = this.hashingService.compare(credentials.password, account.password);
    if (isPasswordCorrect) {
      const payload: PayloadDto = { sub: account.id };
      const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });

      return { accessToken };
    }
    throw new BadRequestException(Errors.INCORRECT_CREDENTIALS);
  }
}
