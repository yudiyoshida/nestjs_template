import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { IAccountRepository } from 'src/modules/account/repositories/account-repository.interface';
import { TOKENS } from 'src/shared/di/tokens';
import { IHashingService } from 'src/shared/helpers/hashing/hashing.interface';
import { PayloadDto } from '../../types/payload.type';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class LoginService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository,
    @Inject(TOKENS.IHashingService) private hashingHelper: IHashingService,
    private jwtService: JwtService
  ) {}

  public async execute(credentials: LoginDto) {
    const account = await this.accountRepository.findByEmail(credentials.email);
    if (!account) {
      throw new BadRequestException('Credenciais incorretas.');
    }

    const isPasswordCorrect = this.hashingHelper.compare(credentials.password, account.password);
    if (!isPasswordCorrect) {
      throw new BadRequestException('Credenciais incorretas.');
    }

    const payload: PayloadDto = { sub: account.id };
    const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });

    return { accessToken };
  }
}
