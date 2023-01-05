import { Injectable, NotFoundException } from "@nestjs/common";
import { ERole, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateStudentDto } from "../user/dto/create-user.dto";
import { StudentSearchDto } from "./dto/student-search.dto";

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: StudentSearchDto) {
    const where: Prisma.UserWhereInput = { role: ERole.STUDENT };
    if (dto.academicYear) where.academicYearId = dto.academicYear;
    if (dto.name) where.fullName = { contains: dto.name };
    if (dto.school) where.schoolId = dto.school;
    const students = await this.prisma.user.findMany({
      where: { ...where },
    });
    return students;
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
        studentId: dto.regNo,
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
}
