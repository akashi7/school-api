import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EAcademicTerm,
  EFeeType,
  ERole,
  Fee,
  Payment,
  Prisma,
  User,
} from "@prisma/client";
import { Workbook } from "exceljs";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { EPaymentStatus } from "../payment/enums";
import { PaymentService } from "../payment/payment.service";
import { PrismaService } from "../prisma.service";
import { ViewStudentFeeDto } from "./dto/ViewStudentFee.dto";
import { CreateFeeDto } from "./dto/create-fee.dto";
import {
  DownloadFeesByClassroomsDto,
  DownloadFeesByStudentsDto,
} from "./dto/download-fees.dto";
import { FindFeesByStudentDto, FindFeesDto } from "./dto/find-fees.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";

@Injectable()
export class FeeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Create a fee
   * @param dto create object
   * @param user logged in user
   * @returns fee
   */
  async create(dto: CreateFeeDto, user: User) {
    return await this.prismaService.$transaction(async (tx) => {
      // TODO: check if fee with the same academic year, classes and terms already exists
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
    let payload: any;
    if (user.role === ERole.ADMIN) {
      payload = await paginate<Fee, Prisma.FeeFindManyArgs>(
        this.prismaService.fee,
        {
          include: {
            classrooms: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        +page,
        +size,
      );
    } else {
      const whereConditions = this.getFeesWhereConditions(findDto, user);
      payload = await paginate<Fee, Prisma.FeeFindManyArgs>(
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
    }
    return payload;
  }

  /**
   * Build where conditions for find fees
   * @param findDto find options
   * @param user logged in user
   * @returns where condition object
   */
  private getFeesWhereConditions(findDto: FindFeesDto, user: User) {
    let schoolId: string;
    if (!user.schoolId) {
      (async () => {
        const children = await this.prismaService.user.findFirst({
          where: {
            role: ERole.STUDENT,
            parentId: user.id,
          },
        });
        schoolId = children.schoolId;
      })();
    }
    const whereConditions: Prisma.FeeWhereInput = {
      schoolId: !user.schoolId ? schoolId : user.schoolId,
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
    if (findDto.installment === "true")
      whereConditions.type = EFeeType.SCHOOL_FEE;
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
          student:
            user.role === ERole.SCHOOL
              ? { id, schoolId: user.schoolId }
              : user.role === ERole.STUDENT
              ? { id: user.id }
              : user.role === ERole.PARENT
              ? { id, parentId: user.id }
              : { id, relativeId: user.id },
          academicYearId: dto.academicYearId,
        },
        include: {
          student: { select: { stream: { select: { classroomId: true } } } },
        },
      });
    const school = await this.prismaService.user.findFirst({
      where: {
        id,
      },
    });
    if (!studentPromotion)
      throw new NotFoundException("Student promotion not found");
    const fees = await this.prismaService.fee.findMany({
      where: {
        schoolId:
          user.role === ERole.PARENT || ERole.RELATIVE
            ? school.schoolId
            : user.role === ERole.STUDENT
            ? user.schoolId
            : user.id,
        classroomIDs: {
          has: studentPromotion.student.stream.classroomId,
        },
        academicYearId: dto.academicYearId,
        academicTerms: { has: dto.academicTerm },
      },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });
    // TODO: Change this logic to get results for remaining fees
    const resultFees = [];
    for (const fee of fees) {
      const feeDto = new ViewStudentFeeDto();
      feeDto.id = fee.id;
      feeDto.name = fee.name;
      feeDto.type = fee.type;
      feeDto.optional = fee.optional;
      feeDto.amount = fee.amount;
      feeDto.createdAt = fee.createdAt;
      feeDto.paid = fee.payments
        .filter((p) => p.status === EPaymentStatus.SUCCESS)
        .reduce((sum: number, t: Payment) => sum + t.amount, 0);
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
    const classroomIDs = dto.classroomIDs;

    const checkIfClassroomsExist = async () => {
      const classroomCount = await this.prismaService.classroom.count({
        where: {
          id: { in: classroomIDs },
          schoolId: user.schoolId,
        },
      });

      return classroomCount === classroomIDs.length;
    };

    const areClassroomsExisting = await checkIfClassroomsExist();

    await this.findOne(id, user);
    if (dto.academicYearId) {
      if (
        !(await this.prismaService.academicYear.count({
          where: { id: dto.academicYearId },
        }))
      )
        throw new NotFoundException("Academic year not found");
    }
    if (!areClassroomsExisting) {
      throw new BadRequestException("One of the classrooms does not exist");
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

    let totalTerm1 = 0;
    let totalTerm2 = 0;
    let totalTerm3 = 0;

    worksheet.columns = [
      { header: "No", key: "no" },
      { header: "NAME", key: "name", width: 28 },
      { header: "1st TERM", key: "term1", width: 28 },
      { header: "1st TERM BAL", key: "term1Bal", width: 28 },
      { header: "2nd TERM", key: "term2", width: 28 },
      { header: "2nd TERM BAL", key: "term2Bal", width: 28 },
      { header: "3rd TERM", key: "term3", width: 28 },
      { header: "3rd TERM BAL", key: "term3Bal", width: 28 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };

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

      totalTerm1 += fees
        .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM1))
        .reduce((a, fee) => a + fee.amount, 0);

      totalTerm2 += fees
        .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM2))
        .reduce((a, fee) => a + fee.amount, 0);

      totalTerm3 += fees
        .filter((fee) => fee.academicTerms.includes(EAcademicTerm.TERM3))
        .reduce((a, fee) => a + fee.amount, 0);

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
    worksheet.addRow({
      no: "Total",
      name: "Total",
      term1: totalTerm1,
      term2: totalTerm2,
      term3: totalTerm3,
    });

    const lastRow = worksheet.lastRow;

    lastRow.font = { bold: true };
    return {
      workbook,
      filename: `FEES_CLEARANCE_REPORT_${stream.classroom.name}_${stream.name}`,
    };
  }
}
