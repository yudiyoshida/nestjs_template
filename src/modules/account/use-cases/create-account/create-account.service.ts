import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IHashingService } from 'src/infra/hashing/hashing.interface';
import { AccountPermissionEnum } from 'src/modules/auth/enums/permissions.enum';
import { Errors } from 'src/shared/errors/error-message';
import { TOKENS } from 'src/shared/ioc/tokens';
import { AccountPermission } from '../../entities/account-permission.entity';
import { IAccountRepository } from '../../repositories/account-repository.interface';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class CreateAccountService {
  constructor(
    @Inject(TOKENS.IAccountRepository) private accountRepository: IAccountRepository,
    @Inject(TOKENS.IHashingService) private hashingService: IHashingService
  ) {}

  public async execute(data: CreateAccountDto) {
    const emailIsNotUnique = await this.accountRepository.findByEmail(data.email);
    if (emailIsNotUnique) {
      throw new ConflictException(Errors.EMAIL_IS_NOT_UNIQUE);
    }

    // hash password.
    data.password = this.hashingService.hash(data.password);

    // define permissions.
    const accountPermissions = this.setUserPermissions();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, permissions, ...newAccount } = await this.accountRepository.save(data, 'ativo', accountPermissions);

    return newAccount;
  }

  private setUserPermissions() {
    const permissions: AccountPermission[] = [];

    permissions.push({ action: AccountPermissionEnum.PERMISSION_TEST });

    return permissions;
  }
}
