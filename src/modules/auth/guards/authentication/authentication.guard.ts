import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { PayloadDto } from '../../types/payload.type';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    try {
      if (!token) {
        throw new Error();
      }

      const payload = this.extractPayloadFromToken(token);
      request.auth = payload;

    } catch {
      throw new UnauthorizedException('É necessário estar autenticado.');

    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractPayloadFromToken(token: string): PayloadDto {
    return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
  }
}

