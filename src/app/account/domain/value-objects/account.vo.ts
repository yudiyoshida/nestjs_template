import { AccountRole } from '../enums/account-role.enum';
import { AccountStatus } from '../enums/account-status.enum';
import { InvalidAccountRolesError, InvalidAccountStatusError } from './account.error';

export class Account {
  private readonly _status: AccountStatus;
  private readonly _roles: AccountRole[];

  constructor(status: string, roles: string[]) {
    this._status = this.validateStatus(status);
    this._roles = this.validateRoles(roles);
  }

  public get isActive(): boolean {
    return this._status === AccountStatus.ACTIVE;
  }

  public get isInactive(): boolean {
    return this._status === AccountStatus.INACTIVE;
  }

  public get canAuthenticate(): boolean {
    return this.isActive;
  }
  // Add more status checks as needed

  public get isAdmin(): boolean {
    return this._roles.includes(AccountRole.ADMIN);
  }
  // Add more role checks as needed

  private validateStatus(status: string): AccountStatus {
    if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
      throw new InvalidAccountStatusError(status);
    }
    return status as AccountStatus;
  }

  private validateRoles(roles: string[]): AccountRole[] {
    const invalidRoles = roles.filter((role) => !Object.values(AccountRole).includes(role as AccountRole));
    if (invalidRoles.length > 0) {
      throw new InvalidAccountRolesError(invalidRoles);
    }
    return roles as AccountRole[];
  }
}
