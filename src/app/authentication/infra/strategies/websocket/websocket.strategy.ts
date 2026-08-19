import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Socket } from 'socket.io';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { ConfigService } from 'src/core/config/config.service';

@Injectable()
export class JwtWebSocketStrategy extends PassportStrategy(Strategy, 'jwt-ws') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtWebSocketStrategy.extractJwtFromSocket]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  public validate(payload: any): Payload {
    return {
      sub: payload.sub,
      roles: payload.roles,
    };
  }

  private static extractJwtFromSocket(socket: Socket): string | null {
    const [type, token] = socket.handshake.headers?.authorization?.split(' ') || [];
    return type === 'Bearer' ? token : null;
  }
}
