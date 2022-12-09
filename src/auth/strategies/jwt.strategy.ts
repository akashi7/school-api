import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaClient, User } from '@prisma/client';
import 'dotenv/config';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt.payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string => request?.cookies?.nestpay_jwt,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt').secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user = await new PrismaClient().user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
