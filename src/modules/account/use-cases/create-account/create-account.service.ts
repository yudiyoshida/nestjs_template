import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { AccountPermissionsEnum } from 'src/modules/auth/enums/permissions.enum';
import { TOKENS } from 'src/shared/di/tokens';
import { IHashingService } from 'src/shared/helpers/hashing/hashing.interface';
import { AccountPermission } from '../../entities/account-permission.entity';
import { IAccountRepository } from '../../repositories/account-repository.interface';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class CreateAccountService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository,
    @Inject(TOKENS.IHashingService) private hashingHelper: IHashingService
  ) {}

  public async execute(data: CreateAccountDto) {
    const emailIsNotUnique = await this.accountRepository.findByEmail(data.email);
    if (emailIsNotUnique) {
      throw new ConflictException('Email já está sendo utilizado.');
    }

    // hash password.
    data.password = this.hashingHelper.hash(data.password);

    // define permissions.
    const permissions = this.setPermissions();

    return this.accountRepository.save(data, permissions);
  }

  private setPermissions() {
    const permissions: AccountPermission[] = [];

    permissions.push({ action: AccountPermissionsEnum.PERMISSION_TEST });

    return permissions;
  }
}
