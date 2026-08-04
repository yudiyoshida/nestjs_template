import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { RefreshTokenSession } from 'src/app/authentication/application/usecases/refresh-token-session/refresh-token-session.service';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ForbiddenAccountError } from '../../errors/forbidden-account.error';
import { InactiveAccountError } from '../../errors/inactive-account.error';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { RefreshTokenInputDto } from './dtos/refresh-token.dto';
import { RefreshToken } from './refresh-token.service';

describe('RefreshToken - Integration tests', () => {
  let sut: RefreshToken;
  let refreshTokenSession: RefreshTokenSession;
  let prisma: PrismaService;

  function hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  function signRefreshToken(
    payload: Payload,
    secret = refreshTokenSession['configService'].refreshTokenSecret,
  ): string {
    return refreshTokenSession['jwtService'].sign(payload, {
      secret,
      expiresIn: refreshTokenSession['configService'].refreshTokenExpiresIn,
    });
  }

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(RefreshToken);
    refreshTokenSession = module.get(RefreshTokenSession);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.account.deleteMany();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should throw an error if the refresh token signature is invalid', async() => {
    // Arrange
    const payload: Payload = { sub: 'any-id', roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload, 'wrong-secret');
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should throw an error if there is no cached hash for the account', async() => {
    // Arrange
    const account = await prisma.account.create({
      data: {
        roles: { create: { role: AccountRole.STUDENT } },
        email: 'jhondoe@email.com',
        password: 'hashed',
        status: AccountStatus.ACTIVE,
      },
    });
    const payload: Payload = { sub: account.id, roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(null);
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should throw an error if the cached hash does not match the provided token (revoked/rotated)', async() => {
    // Arrange
    const account = await prisma.account.create({
      data: {
        roles: { create: { role: AccountRole.STUDENT } },
        email: 'jhondoe@email.com',
        password: 'hashed',
        status: AccountStatus.ACTIVE,
      },
    });
    const payload: Payload = { sub: account.id, roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(hash('some-other-token'));
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should throw an error if the account no longer exists', async() => {
    // Arrange
    const payload: Payload = { sub: 'ghost-id', roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(hash(refreshToken));
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should throw an error if the account is inactive', async() => {
    // Arrange
    const account = await prisma.account.create({
      data: {
        roles: { create: { role: AccountRole.STUDENT } },
        email: 'jhondoe@email.com',
        password: 'hashed',
        status: AccountStatus.INACTIVE,
      },
    });
    const payload: Payload = { sub: account.id, roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(hash(refreshToken));
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(InactiveAccountError);
    });
  });

  it('should throw an error if the account is pending', async() => {
    // Arrange
    const account = await prisma.account.create({
      data: {
        roles: { create: { role: AccountRole.STUDENT } },
        email: 'jhondoe@email.com',
        password: 'hashed',
        status: AccountStatus.PENDING,
      },
    });
    const payload: Payload = { sub: account.id, roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(hash(refreshToken));
    const data: RefreshTokenInputDto = { refreshToken };

    // Act & Assert
    expect.assertions(1);
    return sut.execute(data).catch((error) => {
      expect(error).toBeInstanceOf(ForbiddenAccountError);
    });
  });

  it('should return a new access/refresh token pair and rotate the cached hash', async() => {
    // Arrange
    const account = await prisma.account.create({
      data: {
        roles: { create: { role: AccountRole.STUDENT } },
        email: 'jhondoe@email.com',
        password: 'hashed',
        status: AccountStatus.ACTIVE,
      },
    });
    const payload: Payload = { sub: account.id, roles: [AccountRole.STUDENT] };
    const refreshToken = signRefreshToken(payload);
    jest.spyOn(refreshTokenSession['cacheGateway'], 'get').mockResolvedValue(hash(refreshToken));
    const cacheSetSpy = jest.spyOn(refreshTokenSession['cacheGateway'], 'set');
    const data: RefreshTokenInputDto = { refreshToken };

    // Act
    const result = await sut.execute(data);

    // Assert
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(cacheSetSpy).toHaveBeenCalledWith(
      `cache:global:refresh-token:detail:${account.id}`,
      hash(result.refreshToken),
      expect.any(Number),
    );
  });
});
