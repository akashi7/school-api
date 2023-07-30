import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, User } from "@prisma/client";
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
    if (await this.prismaService.user.count({ where: { email: dto.email } }))
      throw new BadRequestException("Email already exists");
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
  async findAll(user: User) {
    let payload: any;
    if (!user.schoolId) {
      payload = await this.prismaService.user.findMany({
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
    } else {
      payload = await this.prismaService.user.findMany({
        where: {
          role: ERole.PARENT,
          schoolId: user.schoolId,
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
    }
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

  async getChildren(User: User) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: User.id,
        role: User.role,
      },
    });

    if (!user) throw new NotFoundException("User not found");

    let children: any;

    if (user.role === ERole.PARENT) {
      // If the user's role is PARENT, find children based on parentId
      children = await this.prismaService.user.findMany({
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
    } else if (user.role === ERole.RELATIVE) {
      // If the user's role is RELATIVE, find children based on relativeId
      children = await this.prismaService.user.findMany({
        where: {
          role: ERole.STUDENT,
          relativeId: user.id,
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
    } else {
      throw new Error("Invalid user role"); // Handle other roles if needed
    }

    return children;
  }
}
