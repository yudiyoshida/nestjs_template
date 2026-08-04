import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { RefreshTokenSession } from './refresh-token-session.service';

describe('RefreshTokenSession - Integration tests', () => {
  let sut: RefreshTokenSession;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(RefreshTokenSession);
    prisma = module.get(PrismaService);
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should issue a refresh token and validate it back to the original payload', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id', roles: [AccountRole.STUDENT] };

    // Act
    const refreshToken = await sut.issue(payload);
    const result = await sut.validate(refreshToken);

    // Assert
    expect(refreshToken).toEqual(expect.any(String));
    expect(result).toEqual(expect.objectContaining(payload));
  });

  it('should reject a refresh token that was rotated/revoked (cached hash no longer matches)', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id-2', roles: [AccountRole.STUDENT] };
    const firstToken = await sut.issue(payload);
    await sut.issue(payload);

    // Act & Assert
    expect.assertions(1);
    return sut.validate(firstToken).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should reject a refresh token after it has been revoked', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id-3', roles: [AccountRole.STUDENT] };
    const refreshToken = await sut.issue(payload);

    // Act
    await sut.revoke(payload.sub);

    // Assert
    expect.assertions(1);
    return sut.validate(refreshToken).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });
});
