import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EAcademicTerm, Fee, Prisma, Transaction, User } from "@prisma/client";
import { Workbook } from "exceljs";
import { PrismaService } from "../prisma.service";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateFeeDto } from "./dto/create-fee.dto";
import {
  DownloadFeesByClassroomsDto,
  DownloadFeesByStudentsDto,
} from "./dto/download-fees.dto";
import { FindFeesByStudentDto, FindFeesDto } from "./dto/find-fees.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";
import { ViewStudentFeeDto } from "./dto/ViewStudentFee.dto";

@Injectable()
export class FeeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a fee
   * @param dto create object
   * @param user logged in user
   * @returns fee
   */
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
          schoolId: user.schoolId,
        },
      });
      return newFee;
    });
  }

  /**
   * Find all fees
   * @param param0 pagination options
   * @param findDto find options
   * @param user logged in user
   * @returns fees
   */
  async findAll(
    { page, size }: PaginationDto,
    findDto: FindFeesDto,
    user: User,
  ) {
    const whereConditions = this.getFeesWhereConditions(findDto, user);
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

  /**
   * Build where conditions for find fees
   * @param findDto find options
   * @param user logged in user
   * @returns where condition object
   */
  private getFeesWhereConditions(findDto: FindFeesDto, user: User) {
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
    return whereConditions;
  }

  // TODO Review this logic to get accurate results for optional fees
  /**
   * Find all fees by a student
   * @param id student id
   * @param dto find options
   * @param user logged in user
   * @returns fees
   */
  async findFeesByStudent(id: string, dto: FindFeesByStudentDto, user: User) {
    const studentPromotion =
      await this.prismaService.studentPromotion.findFirst({
        where: {
          student: { schoolId: user.schoolId },
          // studentId: id,
          academicYearId: dto.academicYearId,
        },
        include: {
          student: { select: { stream: { select: { classroomId: true } } } },
        },
      });
    if (!studentPromotion)
      throw new NotFoundException("Student promotion not found");
    const fees = await this.prismaService.fee.findMany({
      where: {
        schoolId: user.schoolId,
        classroomIDs: {
          has: studentPromotion.student.stream.classroomId,
        },
        academicYearId: dto.academicYearId,
        academicTerms: { has: dto.academicTerm },
      },
      include: {
        transactions: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });
    const resultFees = [];
    for (const fee of fees) {
      const feeDto = new ViewStudentFeeDto();
      feeDto.id = fee.id;
      feeDto.name = fee.name;
      feeDto.type = fee.type;
      feeDto.optional = fee.optional;
      feeDto.amount = fee.amount;
      feeDto.createdAt = fee.createdAt;
      feeDto.paid = fee.transactions.reduce(
        (sum: number, t: Transaction) => sum + t.amount,
        0,
      );
      feeDto.remaining = feeDto.amount - feeDto.paid;
      resultFees.push(feeDto);
    }
    return resultFees;
  }

  /**
   * Find one fee
   * @param id fee id
   * @param user logged in user
   * @returns fee
   */
  async findOne(id: string, user: User) {
    const fee = await this.prismaService.fee.findFirst({
      where: { schoolId: user.schoolId, id },
    });
    if (!fee) throw new NotFoundException("Fee not found");
    return fee;
  }

  /**
   * Update a fee
   * @param id fee id
   * @param dto update object
   * @param user logged in user
   * @returns fee
   */
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

  /**
   * Delete a fee
   * @param id fee id
   * @param user logged in user
   * @returns fee id
   */
  async remove(id: string, user: User) {
    await this.findOne(id, user);
    await this.prismaService.fee.delete({ where: { id } });
    return id;
  }
  /**
   * Download fees report by classrooms
   * @param scope the scope of the report
   * @param user logged in user
   */
  async downloadFeesByClassrooms(dto: DownloadFeesByClassroomsDto, user: User) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Fees Report");
    worksheet.columns = [
      { header: "No", key: "no" },
      { header: "CLASS", key: "class" },
      { header: "FEES/STUDENT", key: "feesPerStudent" },
      { header: "PAID AMOUNT", key: "paidAmount" },
      { header: "REMAINING BALANCE", key: "remainingBalance" },
    ];
    const streams = await this.prismaService.stream.findMany({
      where: {
        classroom: { schoolId: user.schoolId },
      },
      include: { classroom: { select: { name: true } } },
    });
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    // Add the data rows
    for (const [i, stream] of streams.entries()) {
      const feesPerStudent = (
        await this.prismaService.fee.findMany({
          where: {
            classroomIDs: { has: stream.classroomId },
            academicYearId: dto.academicYearId,
            academicTerms: { has: dto.term },
            optional: false,
          },
        })
      ).reduce((a, fee) => a + fee.amount, 0);
      worksheet.addRow({
        no: i + 1,
        class: `${stream.classroom.name} ${stream.name}`,
        feesPerStudent,
        paidAmount: 0, // TODO: REVISIT THIS AFTER WORKING ON PAYMENTS
        remainingBalance: 0, // TODO: REVISIT THIS AFTER WORKING ON PAYMENTS
      });
    }
    return {
      workbook,
      filename: `FEES_CLEARANCE_REPORT_${dto.term}_${academicYear.name}`,
    };
  }

  /**
   * Download fees report by classrooms
   * @param scope the scope of the report
   * @param user logged in user
   */
  async downloadFeesByStudents(dto: DownloadFeesByStudentsDto, user: User) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Fees Report");
    worksheet.columns = [
      { header: "No", key: "no" },
      { header: "NAME", key: "name" },
      { header: "1st TERM", key: "term1" },
      { header: "1st TERM BAL", key: "term1Bal" },
      { header: "2nd TERM", key: "term2" },
      { header: "2nd TERM BAL", key: "term2Bal" },
      { header: "3rd TERM", key: "term3" },
      { header: "3rd TERM BAL", key: "term3Bal" },
    ];

    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    const stream = await this.prismaService.stream.findFirst({
      where: { id: dto.streamId },
      include: { classroom: { select: { name: true } } },
    });
    if (!stream) throw new NotFoundException("Stream not found");
    const studentPromotions =
      await this.prismaService.studentPromotion.findMany({
        where: {
          student: { schoolId: user.schoolId },
          streamId: dto.streamId,
          academicYearId: dto.academicYearId,
        },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              stream: { select: { classroomId: true } },
            },
          },
        },
      });
    for (const [i, studentPromotion] of studentPromotions.entries()) {
      const fees = await this.prismaService.fee.findMany({
        where: {
          schoolId: user.schoolId,
          classroomIDs: { has: studentPromotion.student.stream.classroomId },
          academicYearId: dto.academicYearId,
          optional: false,
        },
      });

      worksheet.addRow({
        no: i + 1,
        name: studentPromotion.student.fullName,
        term1: fees
          .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM1))
          .reduce((a, fee) => a + fee.amount, 0),
        term1Bal: 0, // TODO: Revisit this after working on payments,
        term2: fees
          .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM2))
          .reduce((a, fee) => a + fee.amount, 0),
        term2Bal: 0, // TODO: Revisit this after working on payments,
        term3: fees
          .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM3))
          .reduce((a, fee) => a + fee.amount, 0),
        term3Bal: 0, // TODO: Revisit this after working on payments,
      });
    }
    return {
      workbook,
      filename: `FEES_CLEARANCE_REPORT_${stream.classroom.name}_${stream.name}`,
    };
  }
}
