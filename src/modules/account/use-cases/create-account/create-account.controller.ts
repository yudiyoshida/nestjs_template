import { Body, Controller, Post } from '@nestjs/common';
import { OmitType } from '@nestjs/swagger';

import { Swagger } from 'src/shared/decorators/swagger';
import { Account } from '../../entities/account.entity';
import { CreateAccountService } from './create-account.service';
import { CreateAccountDto } from './dtos/create-account.dto';

@Controller()
export class CreateAccountController {
  constructor(private createAccountService: CreateAccountService) {}

  @Post()
  @Swagger({
    tags: ['Conta'],
    summary: 'Rota utilizada para criar uma nova conta',
    createdResponse: OmitType(Account, ['password']),
    applyBadRequest: true,
    applyConflict: true,
  })
  public handle(@Body() data: CreateAccountDto) {
    return this.createAccountService.execute(data);
  }
}
