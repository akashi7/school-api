import { Injectable } from "@nestjs/common";
import { Deductible, Prisma, User } from "@prisma/client";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { PrismaService } from "src/prisma.service";
import { CreateDeductibleDto } from "./dto/create-deductible";
import { FindDeductiblesDto } from "./dto/find-deductibles";

@Injectable()
export class DeductibleService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a deductible
   * @param dto create object
   * @param user logged in user
   * @returns deductible
   */

  async create(dto: CreateDeductibleDto, user: User) {
    // dto.types.forEach(async (obj) => {
    //   await this.prismaService.deductible.create({
    //     data: {
    //       schoolId: user.schoolId,
    //       type: obj["type"],
    //       amount: Number(obj["amount"]),
    //       name: dto.name,
    //       enumaration: dto.enumaration,
    //     },
    //   });
    // });
    const deductible = await this.prismaService.deductible.create({
      data: {
        schoolId: user.schoolId,
        amount: dto.amount,
        enumaration: dto.enumaration,
      },
    });
    return deductible;
  }

  /**
   * Find all deductibles
   * @param param0 pagination options
   * @param findDto find options
   * @param user logged in user
   * @returns deductibles
   */

  async findAll(
    findDto: FindDeductiblesDto,
    { page, size }: IPagination,
    user: User,
  ) {
    const whereConditions: Prisma.DeductibleWhereInput = {
      schoolId: user.schoolId,
    };

    let TypesIds: string[];

    if (findDto.search) {
      const types = await this.prismaService.deductibleTypes.findMany({
        where: {
          name: {
            contains: findDto.search,
            mode: "insensitive",
          },
          schoolId: user.schoolId,
        },
      });
      TypesIds = types.map((type) => type.id);
    }

    if (findDto.enumaration) {
      whereConditions.enumaration = findDto.enumaration;
    }
    const payload = await paginate<Deductible, Prisma.DeductibleFindManyArgs>(
      this.prismaService.deductible,
      {
        where: {
          ...whereConditions,
          deductibleTypeId: {
            in: TypesIds,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          deductible: true,
        },
      },
      +page,
      +size,
    );
    return payload;
  }
}
