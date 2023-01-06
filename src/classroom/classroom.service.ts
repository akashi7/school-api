import { Injectable, NotFoundException } from "@nestjs/common";
import { Classroom, Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateClassroomDto } from "./dto/create-classroom.dto";
import { FindClassroomsDto } from "./dto/find-classrooms.dto";
import { UpdateClassroomDto } from "./dto/update-classroom.dto";

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createClassroomDto: CreateClassroomDto, school: User) {
    const newClassroom = await this.prisma.classroom.create({
      data: {
        name: createClassroomDto.name,
        schoolId: school.id,
      },
    });
    return newClassroom;
  }

  async findAll(
    school: User,
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
  ) {
    const whereConditions: Prisma.ClassroomWhereInput = {};
    if (findDto.schoolId) whereConditions.schoolId = findDto.schoolId; // Override finding by current logged in school if the id is provided
    if (findDto.search)
      whereConditions.name = { contains: findDto.search, mode: "insensitive" };
    const result = await paginate<Classroom, Prisma.ClassroomFindManyArgs>(
      this.prisma.classroom,
      { where: { schoolId: school.id, ...whereConditions } },
      +page,
      +size,
    );
    return result;
  }

  private async findOne(id: string, school: User) {
    const classroom = await this.prisma.classroom.findFirst({
      where: { schoolId: school.id, id },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");
    return classroom;
  }

  async update(
    id: string,
    updateClassroomDto: UpdateClassroomDto,
    school: User,
  ) {
    const classroom = await this.findOne(id, school);
    await this.prisma.classroom.update({
      where: { id: classroom.id },
      data: {
        ...updateClassroomDto,
      },
    });
    return await this.findOne(id, school);
  }

  async remove(id: string, school: User) {
    const classroom = await this.findOne(id, school);
    await this.prisma.classroom.delete({ where: { id: classroom.id } });
    return id;
  }
}
