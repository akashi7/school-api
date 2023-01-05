import { Injectable, NotFoundException } from "@nestjs/common";
import { ERole } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateParentDto } from "../user/dto/create-user.dto";

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParentDto) {
    const payload = await this.prisma.user.create({
      data: {
        role: ERole.PARENT,
        fullName: dto.names,
        username: dto.username,
        phone: dto.phone,
      },
    });
    return payload;
  }

  async findAll() {
    const payload = await this.prisma.user.findMany({
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

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: ERole.PARENT,
      },
      include: { children: true },
    });
    if (!user) throw new NotFoundException("Parent not found");
    return user;
  }
}
