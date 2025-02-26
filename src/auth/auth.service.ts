import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ERole, User } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { MailService } from "src/mail/mail.service";
import { PrismaService } from "../prisma.service";
import {
  AdminLoginDto,
  ChangePasswordDto,
  CheckCodeDto,
  EmployeeLoginDto,
  GoogleLoginDto,
  GoogleSignupDto,
  ParentLoginDto,
  ResetPasswordDto,
  SchoolLoginDto,
  StudentLoginDto,
} from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt.payload.interface";
import { PasswordEncryption } from "./utils/password-encrytion.util";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly passwordEncryption: PasswordEncryption,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
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
      schoolId: user.schoolId,
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
   * Login the employee
   * @param dto login dto
   * @returns tokens
   */

  async employeeLogin(
    dto: EmployeeLoginDto,
  ): Promise<{ accessToken: any; refreshToken: any }> {
    const { countryCode, employeeIdentifier } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        countryCode,
        employeeIdentifier,
        role: ERole.EMPLOYEE,
      },
    });
    if (!user) throw new BadRequestException("Employee account doesn't exist");
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      role: user.role,
      countryName: user.countryName,
      schoolId: user.schoolId,
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
  private async generateTokens({
    id,
    role,
    countryName,
    schoolId,
  }: JwtPayload) {
    const accessToken = await this.jwtService.signAsync({
      id,
      role,
      countryName,
      schoolId,
    });
    const refreshToken = await this.jwtService.signAsync({
      id,
    });
    return { accessToken, refreshToken };
  }

  async studentGoogleLogin(dto: GoogleLoginDto) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const user = await this.prismaService.user.findFirst({
        where: {
          email: ticket.getPayload().email,
        },
      });
      if (!user) throw new NotFoundException("User not found");
      const { accessToken, refreshToken } = await this.generateTokens({
        id: user.id,
        role: user.role,
        countryName: user.countryName,
        schoolId: user?.schoolId,
      });
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken },
      });

      return {
        accessToken,
        refreshToken,
        role: user.role,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async relativeSignup(dto: GoogleSignupDto) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const userExist = await this.prismaService.user.findFirst({
        where: {
          email: ticket.getPayload().email,
        },
      });
      if (userExist)
        throw new ConflictException("user arleady exists with email");

      const user = await this.prismaService.user.create({
        data: {
          role: ERole.RELATIVE,
          fullName: ticket.getPayload().name,
          email: ticket.getPayload().email,
        },
      });

      const { accessToken, refreshToken } = await this.generateTokens({
        id: user.id,
        role: user.role,
        countryName: user.countryName,
        schoolId: user?.schoolId,
      });
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshToken },
      });

      return {
        accessToken,
        refreshToken,
        role: user.role,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async userLogin(dto: AdminLoginDto) {
    const { email, password } = dto;
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
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
      role: user.role,
    };
  }

  async userForgotPassword(dto: ResetPasswordDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new NotFoundException("User with email not found");
    const code = this.makeCode(5);
    await this.prismaService.codePin.create({
      data: {
        code,
        userId: user.id,
      },
    });
    try {
      this.mailService.sendMail(
        `${user?.email}`,
        `Reset password`,
        "no-reply@schoolnestpay.com",
        `Dear ${user?.fullName}, use this code : ${code}  while reseting your password and mind you that it expires in 5 minutes`,
      );
      const { id } = user;
      return { id };
    } catch (error) {
      console.log({ error });
    }
  }

  makeCode(length: number) {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async checkCode(dto: CheckCodeDto) {
    const Code = await this.prismaService.codePin.findFirst({
      where: {
        AND: [
          { code: dto.code },
          { userId: dto.userId },
          { createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
        ],
      },
    });
    if (!Code)
      throw new BadRequestException("Code do not exist or has expired");
    await this.prismaService.codePin.delete({
      where: {
        id: Code.id,
      },
    });
    return;
  }

  async ResetPassword({ password, userId }: ChangePasswordDto) {
    await this.prismaService.user.update({
      data: {
        password: this.passwordEncryption.hashPassword(password),
      },
      where: {
        id: userId,
      },
    });
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });
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
      role: user.role,
    };
  }
}
