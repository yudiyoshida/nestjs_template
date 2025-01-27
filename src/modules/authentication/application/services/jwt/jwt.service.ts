import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadDto } from '../../dtos/payload.dto';

@Injectable()
export class JwtAuthService {
  constructor(private jwtService: JwtService) {}

  public generateToken(data: any): string {
    const payload: PayloadDto = {
      id: data.id,
      role: data.role,
    };

    return this.jwtService.sign(payload, { privateKey: process.env.JWT_SECRET });
  }
}
