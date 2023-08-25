import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ENotification,
  ERole,
  Installment,
  Prisma,
  User,
} from "@prisma/client";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { MailService } from "src/mail/mail.service";
import { MessageService } from "src/message/message.service";
import { PrismaService } from "src/prisma.service";
import { createInstallmentDto } from "./dto/create-installment.dto";
import { DeclineOrApproveInstallmentDto } from "./dto/decline.dto";
import { FindInstallmentDto } from "./dto/find-installments.dto";

@Injectable()
export class InstallmentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly messageService: MessageService,
    private readonly mailservice: MailService,
  ) {}

  /**
   * Create a installment
   * @param dto create object
   * @param user logged in user
   * @returns installment
   */

  async createInstallment(dto: createInstallmentDto, user: User) {
    return await this.prismaService.$transaction(async (tx) => {
      const fees = await tx.fee.findFirst({
        where: {
          id: dto.feeId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      if (!fees) {
        throw new NotFoundException("Fee not found");
      }

      if (fees?.academicTerms.indexOf(dto.academicTerm) === -1) {
        throw new NotFoundException("Term not included for this fee");
      }

      let schoolId: string;

      if (!user.schoolId) {
        const children = await this.prismaService.user.findFirst({
          where: {
            role: ERole.STUDENT,
            parentId: user.id,
          },
        });
        schoolId = children.schoolId;
      }

      const installments = await tx.installment.findFirst({
        where: {
          feeId: dto.feeId,
          studentId: dto.studentId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (installments) {
        throw new ConflictException(
          "Installment already exist for the given feed",
        );
      }

      const minimumAmount = fees?.amount / dto.installmentNumber;

      const installment = await tx.installment.create({
        data: {
          installmentNumber: dto.installmentNumber,
          minimumAmount,
          schoolId: user.schoolId ? user.schoolId : schoolId,
          feeId: fees.id,
          studentId: dto.studentId,
          reason: dto.reason,
          term: dto.academicTerm,
        },
      });

      dto.installments.forEach(async (obj) => {
        await tx.installmentNumber.create({
          data: {
            installmentId: installment.id,
            date: obj.date,
            amount: obj.amount,
          },
        });
      });

      await tx.schoolNotification.create({
        data: {
          name: ENotification.INSTALLMENT,
          installmentId: installment.id,
        },
      });

      const message = await this.messageService.createMessage("0781273704");
      if (message) {
        console.log("sent");
      }

      return installment;
    });
  }
  /**
   * Find all installments
   * @param user logged in user
   * @returns installments
   */

  async findAllInstallment(
    dto: FindInstallmentDto,
    { page, size }: IPagination,
    user: User,
  ) {
    let schoolId: string;

    if (user.role === ERole.RELATIVE) {
      const children = await this.prismaService.user.findFirst({
        where: {
          role: ERole.STUDENT,
          relativeId: user.id,
        },
      });
      schoolId = children.schoolId;
    }

    if (user.role === ERole.PARENT) {
      const children = await this.prismaService.user.findFirst({
        where: {
          role: ERole.STUDENT,
          parentId: user.id,
        },
      });
      schoolId = children.schoolId;
    }
    const installmentWhereInput: Prisma.InstallmentWhereInput = {
      schoolId: user.schoolId ? user.schoolId : schoolId,
    };
    const userWhereInput: Prisma.UserWhereInput = {};

    if (dto.studentId) {
      userWhereInput.id = dto.studentId;
    }

    const feeWhereInput: Prisma.FeeWhereInput = {};

    if (dto.search) {
      if (!user.schoolId) {
        feeWhereInput.name = {
          contains: dto.search,
          mode: "insensitive",
        };
      } else {
        userWhereInput.OR = [
          {
            fullName: { contains: dto.search, mode: "insensitive" },
          },
          {
            studentIdentifier: { contains: dto.search, mode: "insensitive" },
          },
        ];
      }
    }

    const result = await paginate<Installment, Prisma.InstallmentFindManyArgs>(
      this.prismaService.installment,
      {
        where: {
          ...installmentWhereInput,
          fee: {
            ...feeWhereInput,
          },
          student: {
            ...userWhereInput,
          },
        },
        include: {
          fee: true,
          student: true,
          installments: true,
        },
      },
      +page,
      +size,
    );
    return result;
  }

  async approveOrDecline(dto: DeclineOrApproveInstallmentDto) {
    await this.prismaService.installment.update({
      where: {
        id: dto.id,
      },
      data: {
        response: dto.response,
        approveStatus: true,
        status: dto.status,
      },
    });
    const installment = await this.prismaService.installment.findFirst({
      where: {
        id: dto.id,
      },
      include: {
        student: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });
    try {
      return this.mailservice.sendMail(
        `${installment?.student?.email}`,
        "Installment notification",
        "no-reply@schoolnestpay.com",
        `Hello ${installment?.student?.fullName}, we are informing you that your installment has been ${dto.status} visit your dashboard for more information`,
      );
    } catch (error) {
      console.log({ error });
    }
    return;
  }
}
