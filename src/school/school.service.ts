import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ERole } from "@prisma/client";
import { PasswordEncryption } from "../auth/utils/password-encrytion.util";
import { PrismaService } from "../prisma.service";
import { CreateSchoolDto } from "./dto/create-school.dto";
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
  async create({ username, password, ...schoolDto }: CreateSchoolDto) {
    if (await this.prismaService.user.count({ where: { username } }))
      throw new BadRequestException("Username already exists");
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const newSchool = await tx.school.create({
          data: {
            schoolName: schoolDto.schoolName,
            schoolType: schoolDto.schoolType,
            schoolTitle: schoolDto.schoolTitle,
            schoolLogo: schoolDto.schoolLogo,
            hasStudentIds: schoolDto.hasStudentIds,
            hasEmployeeIds: schoolDto.hasEmployeeIds,
            countryName: schoolDto.countryName,
            countryCode: schoolDto.countryCode,
            address: schoolDto.address,
          },
        });
        await tx.user.create({
          data: {
            role: ERole.SCHOOL,
            username,
            password: this.passwordEncryption.hashPassword(password),
            schoolId: newSchool.id,
            phone: schoolDto.phone,
            email: schoolDto.email,
          },
        });
        return newSchool;
      });
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException("Could not create school");
    }
  }

  /**
   * Find all schools
   * @returns schools
   */
  async findAll() {
    const payload = await this.prismaService.school.findMany({ where: {} });
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
   * @param schoolId school id
   * @param dto update school object
   * @returns Updated school
   */
  async update(schoolId: string, dto: UpdateSchoolDto) {
    const school = await this.findOne(schoolId);
    await this.prismaService.school.update({
      where: { id: school.id },
      data: { ...dto },
    });
    return await this.findOne(school.id);
  }
}
