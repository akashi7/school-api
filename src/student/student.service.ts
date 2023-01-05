import { Injectable, NotFoundException } from "@nestjs/common";
import { ERole, Prisma, User } from "@prisma/client";
import { endOfMonth, getMonth, startOfMonth } from "date-fns";
import { PrismaService } from "../prisma.service";
import { CreateStudentDto } from "../user/dto/create-user.dto";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { paginate } from "../__shared__/utils/pagination.util";
import { StudentSearchDto } from "./dto/student-search.dto";

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: StudentSearchDto, { page, size }: IPagination) {
    const whereConditions: Prisma.UserWhereInput = { role: ERole.STUDENT };
    if (dto.academicYear) whereConditions.academicYearId = dto.academicYear;
    if (dto.name) whereConditions.fullName = { contains: dto.name };
    if (dto.school) whereConditions.schoolId = dto.school;
    const result = await paginate<User, Prisma.UserFindManyArgs>(
      this.prisma.user,
      { where: { ...whereConditions } },
      { page, size },
    );
    return result;
  }

  async create(dto: CreateStudentDto) {
    const school = await this.prisma.user.findFirst({
      where: { id: dto.schoolId, role: ERole.SCHOOL },
    });
    if (!school) throw new NotFoundException("School not found");
    const parent = await this.prisma.user.findFirst({
      where: { id: dto.parentId, role: ERole.PARENT },
    });
    if (!parent) throw new NotFoundException("Parent not found");
    const payload = await this.prisma.user.create({
      data: {
        role: ERole.STUDENT,
        fullName: dto.names,
        username: dto.username,
        studentId: school.hasStudentIds
          ? dto.studentId
          : await this.generateStudentId(),
        academicYearId: dto.academicYear,
        schoolId: school.id,
        parentId: parent.id,
      },
    });
    return payload;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: ERole.STUDENT,
      },
      include: { parent: true, school: true },
    });
    if (!user) throw new NotFoundException("Student not found");
    return user;
  }

  async generateStudentId() {
    const now = new Date();
    const id =
      (await this.prisma.user.count({
        where: {
          role: ERole.STUDENT,
          createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
      })) + 1;
    const month = getMonth(now);
    return `${now.getFullYear}${month > 9 ? month : `0${month}`}${id}`;
  }
}
