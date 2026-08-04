import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RefreshTokenSession } from 'src/app/authentication/application/usecases/refresh-token-session/refresh-token-session.service';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { InvalidRefreshTokenError } from '../../errors/invalid-refresh-token.error';
import { Logout } from './logout.service';

describe('Logout - Integration tests', () => {
  let sut: Logout;
  let refreshTokenSession: RefreshTokenSession;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(Logout);
    refreshTokenSession = module.get(RefreshTokenSession);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should revoke the cached refresh token session for the account', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id', roles: [AccountRole.STUDENT] };
    const refreshToken = await refreshTokenSession.issue(payload);

    // Act
    await sut.execute(payload.sub);

    // Assert
    expect.assertions(1);
    return refreshTokenSession.validate(refreshToken).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });

  it('should return the success message', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id', roles: [AccountRole.STUDENT] };
    await refreshTokenSession.issue(payload);

    // Act
    const result = await sut.execute(payload.sub);

    // Assert
    expect(result).toEqual({ message: 'Sessão encerrada com sucesso.' });
  });
});
