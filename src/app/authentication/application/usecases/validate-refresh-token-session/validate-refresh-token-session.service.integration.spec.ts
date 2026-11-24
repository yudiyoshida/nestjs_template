import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { InvalidRefreshTokenError } from 'src/app/authentication/application/errors/invalid-refresh-token.error';
import { IssueRefreshTokenSession } from 'src/app/authentication/application/usecases/issue-refresh-token-session/issue-refresh-token-session.service';
import { AuthenticationModule } from 'src/app/authentication/authentication.module';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ValidateRefreshTokenSession } from './validate-refresh-token-session.service';

describe('ValidateRefreshTokenSession - Integration tests', () => {
  let sut: ValidateRefreshTokenSession;
  let issueRefreshTokenSession: IssueRefreshTokenSession;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AuthenticationModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(ValidateRefreshTokenSession);
    issueRefreshTokenSession = module.get(IssueRefreshTokenSession);
    prisma = module.get(PrismaService);
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    // Act & Assert
    expect(sut).toBeDefined();
  });

  it('should return the original payload for a token issued by IssueRefreshTokenSession', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id', roles: [AccountRole.STUDENT] };
    const refreshToken = await issueRefreshTokenSession.execute(payload);

    // Act
    const result = await sut.execute(refreshToken);

    // Assert
    expect(result).toEqual(expect.objectContaining(payload));
  });

  it('should reject a token that a newer issue for the same account rotated', async() => {
    // Arrange
    const payload: Payload = { sub: 'account-id-2', roles: [AccountRole.STUDENT] };
    const firstToken = await issueRefreshTokenSession.execute(payload);
    await issueRefreshTokenSession.execute(payload);

    // Act & Assert
    expect.assertions(1);
    return sut.execute(firstToken).catch((error) => {
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
    });
  });
});
