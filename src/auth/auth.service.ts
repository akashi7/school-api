import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ERole, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AdminLoginDto } from "./dto/login.dto";
import { PasswordEncryption } from "./utils/password-encrytion";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly passwordEncryption: PasswordEncryption,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async adminLogin(dto: AdminLoginDto) {
    const { username, password } = dto;
    console.log(dto);
    const user = await this.prismaService.user.findFirst({
      where: {
        username,
        role: ERole.ADMIN,
      },
    });
    if (!user) {
      throw new BadRequestException("The email or password is incorrect");
    } else {
      const isMatch = this.passwordEncryption.comparePassword(
        password,
        user.password,
      );
      if (!isMatch) {
        throw new BadRequestException("The email or password is incorrect");
      }
      const accessToken = await this.jwtService.signAsync({
        id: user.id,
        role: user.role,
      });
      const refreshToken = await this.jwtService.signAsync({
        id: user.id,
      });
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken },
      });

      return {
        accessToken,
        refreshToken,
      };
    }
  }

  async getProfile(user: User): Promise<Partial<User>> {
    const profile = await this.prismaService.user.findFirst({
      where: {
        id: user.id,
      },
    });
    return profile;
  }

  async refreshToken({
    id,
    role,
    refreshToken,
  }: User): Promise<{ accessToken: string; refreshToken: string }> {
    return {
      accessToken: await this.jwtService.signAsync({
        id,
        role,
      }),
      refreshToken,
    };
  }

  async logout({ id }: User): Promise<{ accessToken: string }> {
    await this.prismaService.user.update({
      where: { id },
      data: { refreshToken: null },
    });
    return;
  }
}
