import { ConflictException, Injectable } from "@nestjs/common";
import { Position, Prisma, User } from "@prisma/client";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { paginate } from "src/__shared__/utils/pagination.util";
import { PrismaService } from "src/prisma.service";
import { createPositionDto } from "./dto/employee-position.dto";
import { PositionSearchDto } from "./dto/search-position.dto";

@Injectable()
export class PositionService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a position
   * @param dto create object
   * @param user logged in user
   * @returns position
   */

  async createEmployeePosition(dto: createPositionDto, user: User) {
    const existingPosition = await this.prismaService.position.findFirst({
      where: {
        schoolId: user.schoolId,
        name: {
          mode: "insensitive",
          contains: dto.positionName,
        },
      },
    });
    if (existingPosition) {
      throw new ConflictException("Position arleady exists");
    }
    const position = this.prismaService.position.create({
      data: {
        schoolId: user.schoolId,
        name: dto.positionName,
      },
    });
    return position;
  }

  /**
   * FInd all positions
   * @param dto
   * @param param1
   * @param user
   * @returns
   */

  async findAllPosition(
    findDto: PositionSearchDto,
    { page, size }: IPagination,
    user: User,
  ) {
    const whereConditions: Prisma.PositionWhereInput = {};
    if (findDto.search)
      whereConditions.name = {
        contains: findDto.search,
        mode: "insensitive",
      };
    const result = await paginate<Position, Prisma.PositionFindManyArgs>(
      this.prismaService.position,
      {
        where: {
          schoolId: user.schoolId,
          ...whereConditions,
        },
        include: {
          User: true,
        },
      },
      +page,
      +size,
    );
    return result;
  }
}
