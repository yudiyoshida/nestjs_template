import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GetAccountByEmailService } from 'src/modules/account/use-cases/get-account-by-email/get-account-by-email.service';
import { TOKENS } from 'src/shared/di/tokens';
import { IHashingService } from 'src/shared/helpers/hashing/hashing.interface';
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
      throw new BadRequestException('Credenciais incorretas.');
    }

    const isPasswordCorrect = this.hashingService.compare(credentials.password, account.password);
    if (isPasswordCorrect) {
      const payload: PayloadDto = { sub: account.id };
      const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });

      return { accessToken };
    }
    throw new BadRequestException('Credenciais incorretas.');
  }
}
