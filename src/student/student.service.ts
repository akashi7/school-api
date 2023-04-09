import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, Prisma, User } from "@prisma/client";
import { endOfMonth, getMonth, startOfMonth } from "date-fns";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { paginate } from "../__shared__/utils/pagination.util";
import { ClassroomService } from "../classroom/classroom.service";
import { PrismaService } from "../prisma.service";
import { CreateExtraFeeDto } from "./dto/create-extra-fee.dto";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { CreateStudentDto } from "./dto/create-student.dto";
import { studentFields } from "./dto/student-fields";
import { StudentSearchDto } from "./dto/student-search.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classroomService: ClassroomService,
  ) {}
  /**
   * FInd all students
   * @param dto
   * @param param1
   * @param user
   * @returns
   */
  async findAll(
    dto: StudentSearchDto,
    { page, size }: IPagination,
    user: User,
  ) {
    const whereConditions: Prisma.UserWhereInput = {};
    const studentPromotionWhereInput: Prisma.StudentPromotionWhereInput = {};
    if (dto.academicYearId)
      whereConditions.studentPromotions = {
        some: {
          academicYearId: dto.academicYearId,
        },
      };
    if (dto.classroomId)
      whereConditions.stream = {
        classroomId: dto.classroomId,
      };
    if (dto.streamId) {
      studentPromotionWhereInput.streamId = dto.streamId;
      whereConditions.studentPromotions = {
        some: { ...studentPromotionWhereInput },
      };
    }
    if (dto.search)
      whereConditions.OR = [
        {
          fullName: { contains: dto.search, mode: "insensitive" },
        },
        {
          studentIdentifier: { contains: dto.search, mode: "insensitive" },
        },
      ];
    const result = await paginate<User, Prisma.UserFindManyArgs>(
      this.prismaService.user,
      {
        where: {
          schoolId: user.schoolId,
          role: ERole.STUDENT,
          ...whereConditions,
        },
        include: {
          studentPromotions: {
            where: { ...studentPromotionWhereInput },
            select: {
              id: true,
              stream: {
                select: {
                  id: true,
                  name: true,
                  classroom: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          parent: { select: { id: true, phone: true } },
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

  /**
   * Create a student
   * @param dto create object
   * @param user logged in user
   * @returns user (student)
   */
  async create(dto: CreateStudentDto, user: User) {
    return await this.prismaService.$transaction(async (tx) => {
      let parent = await tx.user.findFirst({
        where: { phone: dto.parentPhoneNumber, role: ERole.PARENT },
      });
      if (!parent) {
        parent = await tx.user.create({
          data: {
            phone: dto.parentPhoneNumber,
            role: ERole.PARENT,
            fullName: `${dto.fullName}'s Parent`,
          },
        });
      }
      await this.classroomService.findOneStream(dto.streamId, null, user);
      const academicYear = await tx.academicYear.findFirst({
        where: { id: dto.academicYearId },
      });
      if (!academicYear) throw new NotFoundException("Academic year not found");
      const existingEmailStudent = await tx.user.findFirst({
        where: { email: dto.email },
      });
      if (existingEmailStudent)
        throw new BadRequestException("Student email already exists");
      const school = await tx.school.findFirst({
        where: { id: user.schoolId },
      });
      if (!school) throw new BadRequestException("School not found");
      const newStudentId = school.hasStudentIds
        ? dto.studentIdentifier
        : await this.generateStudentId();
      delete dto.parentPhoneNumber;
      const payload = await tx.user.create({
        data: {
          role: ERole.STUDENT,
          ...dto,
          studentIdentifier: newStudentId,
          schoolId: user.schoolId,
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

  /**
   * Find one student
   * @param id student id
   * @param user logged in user
   * @returns user (student)
   */
  async findOne(id: string, user?: User) {
    const student = await this.prismaService.user.findFirst({
      where: user
        ? user.role === ERole.SCHOOL
          ? {
              id,
              role: ERole.STUDENT,
              schoolId: user.schoolId,
            }
          : user.role === ERole.PARENT
          ? {
              id,
              role: ERole.STUDENT,
              parent: { id: user.id },
            }
          : {
              id: user.id,
              role: ERole.STUDENT,
            }
        : { id, role: ERole.STUDENT },
      select: {
        ...studentFields,
        parent: { select: { id: true, phone: true } },
        academicYear: { select: { id: true, name: true } },
        stream: {
          select: {
            id: true,
            name: true,
            classroom: { select: { id: true, name: true } },
          },
        },
        school: true,
      },
    });
    if (!student) throw new NotFoundException("Student not found");
    return student;
  }

  /**
   * Generate a student identifier (eg:2023013)
   * @returns student identifier
   */
  async generateStudentId() {
    const now = new Date();
    const id =
      (await this.prismaService.user.count({
        where: {
          role: ERole.STUDENT,
          createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
      })) + 1;
    const month = getMonth(now);
    return `${now.getFullYear()}${month > 9 ? month : `0${month}`}${id}`;
  }

  /**
   * Update a student
   * @param studentId student id
   * @param dto update object
   * @param user logged in user
   * @returns user (student)
   */
  async update(studentId: string, dto: UpdateStudentDto, user: User) {
    await this.findOne(studentId, user);
    if (dto.email) {
      const existingEmailStudent = await this.prismaService.user.findFirst({
        where: { id: { not: studentId }, email: dto.email },
      });
      if (existingEmailStudent)
        throw new BadRequestException("Email already exists");
    }
    if (dto.parentPhoneNumber) {
      const parent = await this.prismaService.user.findFirst({
        where: { role: ERole.PARENT, children: { some: { id: studentId } } },
      });
      if (parent)
        await this.prismaService.user.update({
          where: { id: parent.id },
          data: { phone: dto.parentPhoneNumber },
        });
    }
    delete dto.parentPhoneNumber;
    await this.prismaService.user.update({
      where: { id: studentId },
      data: {
        ...dto,
      },
    });
    return await this.findOne(studentId);
  }

  /**
   * Delete a student
   * @param id student id
   * @param user logged in user
   * @returns student id
   */
  async remove(id: string, user: User) {
    await this.findOne(id, user);
    await this.prismaService.user.delete({ where: { id } });
    return id;
  }

  /**
   * Create a student promotion
   * @param studentIds student id
   * @param dto create object
   * @param user logged in user
   * @returns StudentPromotion
   */
  async createPromotions(dto: CreatePromotionDto, user: User) {
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    await this.classroomService.findOneStream(dto.streamId, null, user);

    await this.prismaService.$transaction(async (tx) => {
      for (const studentId of dto.studentIds) {
        const student = await tx.user.findFirst({
          where: { id: studentId, schoolId: user.schoolId },
        });
        if (!student)
          throw new NotFoundException(`Student [${studentId}] not found`);

        await tx.user.update({
          where: { id: studentId },
          data: {
            academicYearId: dto.academicYearId,
            streamId: dto.streamId,
          },
        });
        await tx.studentPromotion.create({
          data: {
            studentId,
            academicYearId: dto.academicYearId,
            streamId: dto.streamId,
          },
        });
      }
    });
  }

  /**
   * Create extra fee
   * @param studentId
   * @param dto
   * @param user logged in user
   * @returns StudentExtraFee
   */
  async createExtraFee(studentId: string, dto: CreateExtraFeeDto, user: User) {
    await this.findOne(studentId, user);
    const fee = await this.prismaService.fee.findFirst({
      where: { id: dto.feeId, schoolId: user.schoolId },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    return await this.prismaService.studentExtraFee.create({
      data: { feeId: dto.feeId, studentId },
    });
  }
  /**
   * Delete Student Extra Fee
   * @param studentId
   * @param extraFeeId
   * @param user
   * @returns StudentExtraFee
   */
  async deleteExtraFee(studentId: string, extraFeeId: string, user: User) {
    await this.findOne(studentId, user);
    const extraFee = await this.prismaService.studentExtraFee.findFirst({
      where: { id: extraFeeId, studentId: studentId },
    });
    if (!extraFee) throw new NotFoundException("Extra fee not found");
    await this.prismaService.studentExtraFee.delete({
      where: { id: extraFee.id },
    });
    return extraFeeId;
  }
}
