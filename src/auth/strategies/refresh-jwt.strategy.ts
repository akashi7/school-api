import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { PrismaClient, User } from "@prisma/client";
import "dotenv/config";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IAppConfig } from "../../__shared__/interfaces/app-config.interface";
import { JwtPayload } from "../interfaces/jwt.payload.interface";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(private configService: ConfigService<IAppConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.headers?.nestpay_refresh_jwt,
      ]),
      secretOrKey: configService.get("jwt").secret,
      passReqToCallback: true,
      ignoreExpiration: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user = await new PrismaClient().user.findFirst({
      where: { id, refreshToken: req.cookies["nestpay_refresh_jwt"] },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
