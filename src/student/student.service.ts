import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, Prisma, StudentPromotion, User } from "@prisma/client";
import { endOfMonth, getMonth, startOfMonth } from "date-fns";
import { ClassroomService } from "../classroom/classroom.service";
import { PrismaService } from "../prisma.service";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateStudentDto } from "./dto/create-student.dto";
import { studentFields } from "./dto/student-fields";
import { StudentSearchDto } from "./dto/student-search.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classroomService: ClassroomService,
  ) {}

  async findAll(
    dto: StudentSearchDto,
    { page, size }: IPagination,
    school: User,
  ) {
    const whereConditions: Prisma.StudentPromotionWhereInput = {
      student: { schoolId: school.id },
    };
    if (dto.academicYearId) whereConditions.academicYearId = dto.academicYearId;
    if (dto.classroomId) whereConditions.stream.classroom.id = dto.classroomId;
    if (dto.streamId) whereConditions.streamId = dto.classroomId;
    if (dto.search)
      whereConditions.OR = [
        {
          student: { fullName: { contains: dto.search, mode: "insensitive" } },
        },
        {
          stream: { name: { contains: dto.search, mode: "insensitive" } },
        },
        {
          stream: {
            classroom: { name: { contains: dto.search, mode: "insensitive" } },
          },
        },
      ];
    const result = await paginate<
      StudentPromotion,
      Prisma.StudentPromotionFindManyArgs
    >(
      this.prisma.studentPromotion,
      {
        where: { ...whereConditions },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              gender: true,
              address: true,
              firstContactPhone: true,
              secondContactPhone: true,
              studentIdentifier: true,
            },
          },
          stream: {
            select: {
              id: true,
              name: true,
              classroom: { select: { id: true, name: true } },
            },
          },
        },
      },
      +page,
      +size,
    );
    return result;
  }

  async create(dto: CreateStudentDto, school: User) {
    return await this.prisma.$transaction(async (tx) => {
      let parent = await tx.user.findFirst({
        where: { phone: dto.parentPhoneNumber, role: ERole.PARENT },
      });
      if (!parent) {
        parent = await tx.user.create({
          data: { phone: dto.parentPhoneNumber, role: ERole.PARENT },
        });
      }
      await this.classroomService.findOneStream(dto.streamId, null, school);
      const academicYear = await tx.academicYear.findFirst({
        where: { id: dto.academicYearId },
      });
      if (!academicYear) throw new NotFoundException("Academic year not found");
      const existingEmailStudent = await tx.user.findFirst({
        where: { email: dto.email },
      });
      if (existingEmailStudent)
        throw new BadRequestException("Email already exists");
      const newStudentId = school.hasStudentIds
        ? dto.studentIdentifier
        : await this.generateStudentId();
      delete dto.parentPhoneNumber;
      const payload = await tx.user.create({
        data: {
          role: ERole.STUDENT,
          ...dto,
          studentIdentifier: newStudentId,
          schoolId: school.id,
          parentId: parent.id,
        },
        select: { ...studentFields },
      });
      await tx.studentPromotion.create({
        data: {
          studentId: payload.id,
          streamId: dto.streamId,
          academicYearId: dto.academicYearId,
        },
      });
      return payload;
    });
  }

  async findOne(id: string, school?: User) {
    const user = await this.prisma.user.findFirst({
      where: school
        ? {
            id,
            role: ERole.STUDENT,
            schoolId: school.id,
          }
        : { id, role: ERole.STUDENT },
      select: {
        ...studentFields,
        parent: { select: { id: true, phone: true } },
      },
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

  async update(id: string, dto: UpdateStudentDto, school: User) {
    await this.findOne(id, school);
    if (dto.academicYearId) {
      if (
        !(await this.prisma.academicYear.count({
          where: { id: dto.academicYearId },
        }))
      )
        throw new NotFoundException("Academic year not found");
    }
    if (dto.streamId) {
      await this.classroomService.findOneStream(dto.streamId, null, school);
    }
    if (dto.email) {
      const existingEmailStudent = await this.prisma.user.findFirst({
        where: { id: { not: id }, email: dto.email },
      });
      if (existingEmailStudent)
        throw new BadRequestException("Email already exists");
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
      },
    });
    return await this.findOne(id);
  }

  async remove(id: string, school: User) {
    await this.findOne(id, school);
    await this.prisma.user.delete({ where: { id } });
    return id;
  }
}
