import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ERole, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
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
    private readonly prismaService: PrismaService,
  ) {}
  /**
   * Login the admin
   * @param dto login dto
   * @returns tokens
   */
  async adminLogin(dto: AdminLoginDto) {
    const { email, password } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
        role: ERole.ADMIN,
        deletedAt: { isSet: false },
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
      countryName: user.countryName,
    });
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login the parent
   * @param dto login dto
   * @returns tokens
   */
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
      countryName: user.countryName,
    });
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login the school admin
   * @param dto login dto
   * @returns tokens
   */
  async schoolLogin(
    dto: SchoolLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { countryCode, password, username } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        school: { countryCode },
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
      countryName: user.countryName,
    });
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login the student
   * @param dto login dto
   * @returns tokens
   */
  async studentLogin(
    dto: StudentLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { countryCode, studentIdentifier } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        countryCode,
        studentIdentifier,
        role: ERole.STUDENT,
      },
    });
    if (!user) throw new BadRequestException("Student account doesn't exist");
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
      countryName: user.countryName,
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

  /**
   * Get user profile
   * @param user logged in user
   * @returns user profile
   */
  async getProfile(user: User): Promise<Partial<User>> {
    const profile = await this.prismaService.user.findFirst({
      where: {
        id: user.id,
      },
    });
    delete profile.password;
    return profile;
  }

  /**
   * Refresh token
   * @param param0 user
   * @returns tokens
   */
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

  /**
   * Log out
   * @param param0 user
   * @returns
   */
  async logout({ id }: User): Promise<{ accessToken: string }> {
    await this.prismaService.user.update({
      where: { id },
      data: { refreshToken: null },
    });
    return;
  }

  /**
   * Generate access and refresh tokens
   * @param param0 Jwt payload
   * @returns tokens
   */
  private async generateTokens({ id, role, countryName }: JwtPayload) {
    const accessToken = await this.jwtService.signAsync({
      id,
      role,
      countryName,
    });
    const refreshToken = await this.jwtService.signAsync({
      id,
    });
    return { accessToken, refreshToken };
  }
}
