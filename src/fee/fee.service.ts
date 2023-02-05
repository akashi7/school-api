import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
  async create(dto: CreateFeeDto, user: User) {
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
            where: { id, schoolId: user.schoolId },
          }))
        )
          throw new NotFoundException("One of the classrooms not found");
      }
      const newFee = await tx.fee.create({
        data: {
          type: dto.type,
          name: dto.name,
          academicYearId: dto.academicYearId,
          academicTerms: dto.academicTerms,
          optional: dto.optional,
          amount: dto.amount,
          classroomIDs: dto.classroomIDs,
        },
      });
      return newFee;
    });
  }

  async findAll(
    { page, size }: PaginationDto,
    findDto: FindFeesDto,
    user: User,
  ) {
    const whereConditions: Prisma.FeeWhereInput = {
      schoolId: user.schoolId,
    };
    if (findDto.search)
      whereConditions.OR = [
        { name: { contains: findDto.search, mode: "insensitive" } },
        {
          classrooms: {
            some: { name: { contains: findDto.search, mode: "insensitive" } },
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
    if (findDto.classroomId)
      whereConditions.classroomIDs = { has: findDto.classroomId };
    if (findDto.term) whereConditions.academicTerms = { has: findDto.term };
    const payload = await paginate<Fee, Prisma.FeeFindManyArgs>(
      this.prismaService.fee,
      {
        where: { ...whereConditions },
        include: {
          classrooms: { select: { id: true, name: true } },
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
  async findFeesByStudent(id: string, dto: FindFeesByStudentDto, user: User) {
    const studentPromotion =
      await this.prismaService.studentPromotion.findFirst({
        where: {
          student: { schoolId: user.schoolId },
          studentId: id,
          academicYearId: dto.academicYearId,
        },
        include: {
          student: { select: { stream: { select: { classroomId: true } } } },
        },
      });
    const fees = await this.prismaService.fee.findMany({
      where: {
        schoolId: user.schoolId,
        classroomIDs: {
          has: studentPromotion.student.stream.classroomId,
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

  async findOne(id: string, user: User) {
    const fee = await this.prismaService.fee.findFirst({
      where: { schoolId: user.schoolId, id },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    return fee;
  }

  async update(id: string, dto: UpdateFeeDto, user: User) {
    await this.findOne(id, user);
    delete dto.classroomIDs;

    if (dto.academicYearId) {
      if (
        !(await this.prismaService.academicYear.count({
          where: { id: dto.academicYearId },
        }))
      )
        throw new NotFoundException("Academic year not found");
    }
    if (
      dto.classroomIDs.some(async (id) => {
        const count = await this.prismaService.classroom.count({
          where: { id, schoolId: user.schoolId },
        });
        return !count;
      })
    )
      throw new BadRequestException("One of the classrooms does not exist");
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

  async remove(id: string, user: User) {
    await this.findOne(id, user);
    await this.prismaService.fee.delete({ where: { id } });
    return id;
  }
}
