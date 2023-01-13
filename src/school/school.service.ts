import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole } from "@prisma/client";
import { PasswordEncryption } from "../auth/utils/password-encrytion.util";
import { PrismaService } from "../prisma.service";
import { CreateSchoolDto } from "./dto/create-school.dto";
import { schoolFields } from "./dto/school-fields";

@Injectable()
export class SchoolService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordEncryption: PasswordEncryption,
  ) {}

  async create(dto: CreateSchoolDto) {
    if (
      await this.prismaService.user.count({ where: { username: dto.username } })
    )
      throw new BadRequestException("School username already exists");
    const payload = await this.prismaService.user.create({
      data: {
        role: ERole.SCHOOL,
        ...dto,
        password: this.passwordEncryption.hashPassword(dto.password),
      },
      select: { ...schoolFields },
    });
    return payload;
  }

  async findAll() {
    const payload = await this.prismaService.user.findMany({
      where: {
        role: ERole.SCHOOL,
      },
      select: {
        ...schoolFields,
      },
    });
    return payload;
  }

  async findOne(id: string) {
    const school = await this.prismaService.user.findFirst({
      where: {
        id,
        role: ERole.SCHOOL,
      },
      select: { ...schoolFields },
    });
    if (!school) throw new NotFoundException("School not found");
    return school;
  }
  async delete(id: string) {
    const school = await this.findOne(id);
    await this.prismaService.user.delete({ where: { id: school.id } });
    return id;
  }
}
