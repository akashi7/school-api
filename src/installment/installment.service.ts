import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Installment, Prisma, User } from "@prisma/client";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { PrismaService } from "src/prisma.service";
import { createInstallmentDto } from "./dto/create-installment.dto";
import { FindInstallmentDto } from "./dto/find-installments.dto";

@Injectable()
export class InstallmentService {
  constructor(private readonly prismaService: PrismaService) {}

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

      const installments = await tx.installment.findFirst({
        where: {
          feeId: dto.feeId,
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
          schoolId: user.schoolId,
          feeId: fees.id,
        },
      });

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
    const installmentWhereInput: Prisma.InstallmentWhereInput = {
      schoolId: user.schoolId,
    };

    const result = await paginate<Installment, Prisma.InstallmentFindManyArgs>(
      this.prismaService.installment,
      {
        where: {
          ...installmentWhereInput,
          fee: {
            name: {
              contains: dto.search,
              mode: "insensitive",
            },
          },
        },
        include: {
          fee: true,
        },
      },
      +page,
      +size,
    );

    return result;
  }
}
