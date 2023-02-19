import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, User } from "@prisma/client";
import { PasswordEncryption } from "../auth/utils/password-encrytion.util";
import { PrismaService } from "../prisma.service";
import { CreateSchoolDto } from "./dto/create-school.dto";
import { schoolFields } from "./dto/school-fields";
import { UpdateSchoolDto } from "./dto/update-school.dto";

@Injectable()
export class SchoolService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordEncryption: PasswordEncryption,
  ) {}

  /**
   * Create a school
   * @param dto create object
   * @returns school
   */
  async create(dto: CreateSchoolDto) {
    if (
      await this.prismaService.user.count({ where: { username: dto.username } })
    )
      throw new BadRequestException("Username already exists");
    return this.prismaService.$transaction(async (tx) => {
      const newSchool = await tx.school.create({
        data: {
          ...dto,
        },
      });
      await tx.user.create({
        data: {
          role: ERole.SCHOOL,
          ...dto,
          password: this.passwordEncryption.hashPassword(dto.password),
          schoolId: newSchool.id,
        },
        select: { ...schoolFields },
      });
      return newSchool;
    });
  }

  /**
   * Find all schools
   * @returns schools
   */
  async findAll() {
    const payload = await this.prismaService.school.findMany({
      select: {
        ...schoolFields,
      },
    });
    return payload;
  }

  /**
   * Find a school
   * @param id school id
   * @returns school
   */
  async findOne(id: string) {
    const school = await this.prismaService.school.findFirst({
      where: {
        id,
      },
      select: { ...schoolFields },
    });
    if (!school) throw new NotFoundException("School not found");
    return school;
  }

  /**
   * Delete a school
   * @param id school id
   * @returns school id
   */
  async delete(id: string) {
    const school = await this.findOne(id);
    await this.prismaService.school.delete({ where: { id: school.id } });
    return id;
  }
  /**
   * Update a school
   * @param id school id
   * @param dto update school object
   * @param user Logged in user
   * @returns Updated school
   */
  async update(id: string, dto: UpdateSchoolDto, user: User) {
    const school = await this.prismaService.school.findFirst({ where: { id } });
    if (!school) throw new NotFoundException("School not found");
    if (user.role === ERole.SCHOOL && user.schoolId !== school.id)
      throw new NotFoundException("This school is not found");
    const result = await this.prismaService.school.update({
      where: { id },
      data: {
        ...dto,
      },
    });
    return result;
  }
}
