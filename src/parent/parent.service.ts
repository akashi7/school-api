import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { studentFields } from "../student/dto/student-fields";
import { CreateParentDto } from "./dto/create-parent.dto";

@Injectable()
export class ParentService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a parent
   * @param dto create dto
   * @returns user
   */
  async create(dto: CreateParentDto) {
    if (await this.prismaService.user.count({ where: { phone: dto.phone } }))
      throw new BadRequestException("Phone number already exists");
    const payload = await this.prismaService.user.create({
      data: {
        role: ERole.PARENT,
        ...dto,
      },
    });
    return payload;
  }

  /**
   * Find all parents
   * @returns users
   */
  async findAll() {
    const payload = await this.prismaService.user.findMany({
      where: {
        role: ERole.PARENT,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        email: true,
        username: true,
        phone: true,
        fullName: true,
        countryName: true,
        countryCode: true,
        refreshToken: true,
        active: true,
        role: true,
      },
    });
    return payload;
  }

  /**
   * Find a parent
   * @param id parent id
   * @returns user
   */
  async findOne(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        role: ERole.PARENT,
      },
      include: { children: true },
    });
    if (!user) throw new NotFoundException("Parent not found");
    return user;
  }

  async getChildren(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        role: ERole.PARENT,
      },
    });
    if (!user) throw new NotFoundException("Parent not found");
    const children = await this.prismaService.user.findMany({
      where: {
        role: ERole.STUDENT,
        parentId: user.id,
      },
      select: {
        ...studentFields,
        stream: {
          select: {
            id: true,
            name: true,
            classroom: { select: { id: true, name: true } },
          },
        },
        school: true,
        academicYearId: true,
      },
    });
    return children;
  }
}
