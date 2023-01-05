import { Injectable, NotFoundException } from "@nestjs/common";
import { ERole } from "@prisma/client";
import { PasswordEncryption } from "../auth/utils/password-encrytion.util";
import { PrismaService } from "../prisma.service";
import { CreateSchoolDto } from "../user/dto/create-user.dto";

@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordEncryption: PasswordEncryption,
  ) {}

  async create(dto: CreateSchoolDto) {
    const payload = await this.prisma.user.create({
      data: {
        role: ERole.SCHOOL,
        schoolName: dto.names,
        username: dto.username,
        phone: dto.phone,
        schoolTitle: dto.schoolTitle,
        password: this.passwordEncryption.hashPassword(dto.password),
      },
    });
    return payload;
  }

  async findAll() {
    const payload = await this.prisma.user.findMany({
      where: {
        role: ERole.SCHOOL,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        schoolTitle: true,
        phone: true,
        schoolName: true,
        countryName: true,
        countryCode: true,
        refreshToken: true,
        active: true,
        role: true,
      },
    });
    return payload;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: ERole.SCHOOL,
      },
    });
    if (!user) throw new NotFoundException("School not found");
    return user;
  }
}
