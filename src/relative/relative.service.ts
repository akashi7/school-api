import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ERole, User } from "@prisma/client";
import { studentFields } from "src/student/dto/student-fields";
import { PrismaService } from "../prisma.service";
import { CreateRelativeDto } from "./dto/create-relative.dto";

@Injectable()
export class RelativeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a relative
   * @param dto create dto
   * @returns user
   */
  async create(dto: CreateRelativeDto) {
    if (await this.prismaService.user.count({ where: { email: dto.email } }))
      throw new BadRequestException("Email already exists");
    const payload = await this.prismaService.user.create({
      data: {
        role: ERole.RELATIVE,
        ...dto,
      },
    });
    return payload;
  }

  async assignStudent(studentId: string, User: User) {
    const relative = await this.prismaService.user.findFirst({
      where: {
        AND: [
          {
            role: ERole.RELATIVE,
            email: User.email,
          },
        ],
      },
    });
    if (!relative) {
      throw new NotFoundException("Relative not found ");
    }
    const student = await this.prismaService.user.findFirst({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found ");
    }

    await this.prismaService.user.update({
      where: {
        id: student.id,
      },
      data: {
        relativeId: relative.id,
      },
    });

    return;
  }

  async getChildren(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        role: ERole.RELATIVE,
      },
    });
    if (!user) throw new NotFoundException("Relative not found");
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
