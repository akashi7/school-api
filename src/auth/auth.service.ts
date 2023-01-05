import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ERole, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { IAppConfig } from "../__shared__/interfaces/app-config.interface";
import {
  AdminLoginDto,
  ParentLoginDto,
  SchoolLoginDto,
  StudentLoginDto,
} from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt.payload.interface";
import { PasswordEncryption } from "./utils/password-encrytion.util";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly passwordEncryption: PasswordEncryption,
    private readonly configService: ConfigService<IAppConfig>,
    private readonly prismaService: PrismaService,
  ) {}

  async adminLogin(dto: AdminLoginDto) {
    const { email, password } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
        role: ERole.ADMIN,
      },
    });
    if (!user)
      throw new BadRequestException("The email or password is incorrect");
    const isMatch = this.passwordEncryption.comparePassword(
      password,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException("The email or password is incorrect");
    }
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
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

  async parentLogin(
    dto: ParentLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { phone } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        phone,
        role: ERole.PARENT,
      },
    });
    if (!user) throw new BadRequestException("Parent account doesn't exist");
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
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
  async schoolLogin(
    dto: SchoolLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { countryCode, password, username } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        countryCode,
        username,
        role: ERole.SCHOOL,
      },
    });
    if (!user) throw new BadRequestException("School account doesn't exist");
    const isMatch = this.passwordEncryption.comparePassword(
      password,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException("The email or password is incorrect");
    }
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
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
  async studentLogin(
    dto: StudentLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { countryCode, regNo } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        countryCode,
        regNo,
        role: ERole.STUDENT,
      },
    });
    if (!user) throw new BadRequestException("Student account doesn't exist");
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
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

  private async generateTokens({ id, role }: JwtPayload) {
    const accessToken = await this.jwtService.signAsync({
      id,
      role,
    });
    const refreshToken = await this.jwtService.signAsync({
      id,
    });
    return { accessToken, refreshToken };
  }
}
