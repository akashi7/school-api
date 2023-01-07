import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AcademicYear, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";

@Injectable()
export class AcademicYearService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAcademicYearDto: CreateAcademicYearDto) {
    return this.prismaService.$transaction(async (tx) => {
      if (
        await this.prismaService.academicYear.count({
          where: {
            name: { equals: createAcademicYearDto.name, mode: "insensitive" },
          },
        })
      )
        throw new BadRequestException(
          `Academic year ${createAcademicYearDto.name} already exists`,
        );
      const newAcademicYear = await tx.academicYear.create({
        data: { ...createAcademicYearDto },
      });
      return newAcademicYear;
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, size } = paginationDto;
    const payload = await paginate<
      AcademicYear,
      Prisma.AcademicYearFindManyArgs
    >(this.prismaService.academicYear, {}, +page, +size);
    return payload;
  }

  async findOne(id: string) {
    const academicYear = await this.prismaService.academicYear.findFirst({
      where: { id },
    });
    if (!academicYear) throw new NotFoundException("Academic year not found");
    return academicYear;
  }

  async update(id: string, updateAcademicYearDto: UpdateAcademicYearDto) {
    await this.findOne(id);
    await this.prismaService.academicYear.update({
      where: { id },
      data: { ...updateAcademicYearDto },
    });
    return await this.findOne(id);
  }

  async setCurrent(id: string) {
    await this.findOne(id);
    await this.prismaService.academicYear.updateMany({
      where: { id: { not: id } },
      data: { current: false },
    });
    await this.prismaService.academicYear.update({
      where: { id },
      data: { current: true },
    });
    return await this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prismaService.academicYear.delete({ where: { id } });
    return id;
  }
}
