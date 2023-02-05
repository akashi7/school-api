import { Injectable, NotFoundException } from "@nestjs/common";
import { EFeeType, Fee, Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateFeeDto } from "./dto/create-fee.dto";
import { FindFeesByStudentDto, FindFeesDto } from "./dto/find-fees.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";

@Injectable()
export class FeeService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateFeeDto, school: User) {
    return await this.prismaService.$transaction(async (tx) => {
      if (
        !(await tx.academicYear.count({
          where: { id: dto.academicYearId },
        }))
      )
        throw new NotFoundException("Academic year not found");
      for (const id of dto.classroomIDs) {
        if (
          !(await tx.classroom.count({
            where: { id, schoolId: school.id },
          }))
        )
          throw new NotFoundException("One of the classrooms not found");
      }
      const newAdditionalFees = await tx.fee.createMany({
        data: [
          ...dto.classroomIDs.map((id) => ({
            type: dto.type,
            name: dto.name,
            academicYearId: dto.academicYearId,
            academicTerms: dto.academicTerms,
            optional: dto.optional,
            amount: dto.amount,
            classroomId: id,
          })),
        ],
      });
      return newAdditionalFees;
    });
  }

  async findAll(
    school: User,
    { page, size }: PaginationDto,
    findDto: FindFeesDto,
  ) {
    const whereConditions: Prisma.FeeWhereInput = {
      classroom: { schoolId: school.id },
    };
    if (findDto.search)
      whereConditions.OR = [
        { name: { contains: findDto.search, mode: "insensitive" } },
        {
          classroom: {
            name: { contains: findDto.search, mode: "insensitive" },
          },
        },
        {
          academicYear: {
            name: { contains: findDto.search, mode: "insensitive" },
          },
        },
      ];
    if (findDto.type) whereConditions.type = findDto.type;
    if (findDto.academicYearId)
      whereConditions.academicYearId = findDto.academicYearId;
    if (findDto.classroomId) whereConditions.classroomId = findDto.classroomId;
    if (findDto.term) whereConditions.academicTerms = { has: findDto.term };
    const payload = await paginate<Fee, Prisma.FeeFindManyArgs>(
      this.prismaService.fee,
      {
        where: { ...whereConditions },
        include: {
          classroom: { select: { id: true, name: true } },
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      +page,
      +size,
    );
    return payload;
  }

  // TODO Review this logic to get accurate results for optional fees
  async findFeesByStudent(id: string, school: User, dto: FindFeesByStudentDto) {
    const studentPromotion =
      await this.prismaService.studentPromotion.findFirst({
        where: {
          student: { schoolId: school.id },
          studentId: id,
          academicYearId: dto.academicYearId,
        },
        include: {
          student: { select: { stream: { select: { classroomId: true } } } },
        },
      });
    const fees = await this.prismaService.fee.findMany({
      where: {
        classroom: {
          schoolId: school.id,
          id: studentPromotion.student.stream.classroomId,
        },
        academicYearId: dto.academicYearId,
      },
    });
    return {
      additionalFees: fees.filter((f) => f.type === EFeeType.ADDITIONAL_FEE),
      totalSchoolFees: fees
        .filter((f) => f.type === EFeeType.SCHOOL_FEE)
        .reduce((sum: number, f: Fee) => sum + (f.amount || 0), 0),
      totalAdditionalFees: fees
        .filter((f) => f.type === EFeeType.ADDITIONAL_FEE)
        .reduce((sum: number, f: Fee) => sum + (f.amount || 0), 0),
    };
  }

  async findOne(id: string, school: User) {
    const fee = await this.prismaService.fee.findFirst({
      where: { classroom: { schoolId: school.id }, id },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    return fee;
  }

  async update(id: string, dto: UpdateFeeDto, school: User) {
    await this.findOne(id, school);
    delete dto.classroomIDs;

    if (dto.academicYearId) {
      if (
        !(await this.prismaService.academicYear.count({
          where: { id: dto.academicYearId },
        }))
      )
        throw new NotFoundException("Academic year not found");
    }
    if (dto.classroomId) {
      if (
        !(await this.prismaService.classroom.count({
          where: { schoolId: school.id, id: dto.classroomId },
        }))
      )
        throw new NotFoundException("Classroom not found");
    }
    await this.prismaService.fee.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
    return await this.prismaService.fee.findFirst({ where: { id } });
  }

  async remove(id: string, school: User) {
    await this.findOne(id, school);
    await this.prismaService.fee.delete({ where: { id } });
    return id;
  }
}
