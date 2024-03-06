import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { GetAccountByIdService } from 'src/modules/account/use-cases/get-account-by-id/get-account-by-id.service';
import { Errors } from 'src/shared/errors/error-message';
import { PayloadDto } from '../../types/payload.type';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private getAccountByIdService: GetAccountByIdService,
  ) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    try {
      if (!token) {
        throw new Error();
      }

      const payload = this.extractPayloadFromToken(token);
      const account = await this.getAccountByIdService.execute(payload.sub);

      request.auth = account;
      return true;

    } catch {
      throw new UnauthorizedException(Errors.UNAUTHORIZED);

    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractPayloadFromToken(token: string): PayloadDto {
    return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
  }
}

