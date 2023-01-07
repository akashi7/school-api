import { Injectable, NotFoundException } from "@nestjs/common";
import { Classroom, Prisma, Stream, User } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { paginate } from "../__shared__/utils/pagination.util";
import { CreateClassroomDto } from "./dto/create-classroom.dto";
import { CreateStreamDto } from "./dto/create-stream.dto";
import { FindClassroomsDto } from "./dto/find-classrooms.dto";
import { UpdateClassroomDto } from "./dto/update-classroom.dto";
import { UpdateStreamDto } from "./dto/update-stream.dto";

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateClassroomDto, school: User) {
    const newClassroom = await this.prisma.classroom.create({
      data: {
        name: dto.name,
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

  async findOne(id: string, school?: User) {
    const classroom = await this.prisma.classroom.findFirst({
      where: school ? { schoolId: school.id, id } : { id },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");
    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto, school: User) {
    const classroom = await this.findOne(id, school);
    await this.prisma.classroom.update({
      where: { id: classroom.id },
      data: {
        ...dto,
      },
    });
    return await this.findOne(id);
  }

  async remove(id: string, school: User) {
    const classroom = await this.findOne(id, school);
    await this.prisma.classroom.delete({ where: { id: classroom.id } });
    return id;
  }

  async findClassroomStreams(
    school: User,
    classroomId: string,
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
  ) {
    const whereConditions: Prisma.StreamWhereInput = { classroomId };
    if (findDto.schoolId) whereConditions.classroom.schoolId = findDto.schoolId; // Override finding by current logged in school if the id is provided
    if (findDto.search)
      whereConditions.OR = [
        { name: { contains: findDto.search, mode: "insensitive" } },
        {
          classroom: {
            name: { contains: findDto.search, mode: "insensitive" },
          },
        },
      ];
    const result = await paginate<Stream, Prisma.StreamFindManyArgs>(
      this.prisma.stream,
      {
        where: { classroom: { schoolId: school.id }, ...whereConditions },
        include: { classroom: { select: { id: true, name: true } } },
      },
      +page,
      +size,
    );
    return result;
  }
  async findAllStreams(
    school: User,
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
  ) {
    const whereConditions: Prisma.StreamWhereInput = {};
    if (findDto.schoolId) whereConditions.classroom.schoolId = findDto.schoolId; // Override finding by current logged in school if the id is provided
    if (findDto.search)
      whereConditions.OR = [
        { name: { contains: findDto.search, mode: "insensitive" } },
        {
          classroom: {
            name: { contains: findDto.search, mode: "insensitive" },
          },
        },
      ];
    const result = await paginate<Stream, Prisma.StreamFindManyArgs>(
      this.prisma.stream,
      {
        where: { classroom: { schoolId: school.id }, ...whereConditions },
        include: { classroom: { select: { id: true, name: true } } },
      },
      +page,
      +size,
    );
    return result;
  }

  async findOneStream(id: string, classroomId?: string, school?: User) {
    const stream = await this.prisma.stream.findFirst({
      where: school
        ? classroomId
          ? { classroom: { schoolId: school.id }, id, classroomId }
          : { classroom: { schoolId: school.id }, id }
        : classroomId
        ? { id, classroomId }
        : { id },
    });
    if (!stream) throw new NotFoundException("Stream not found");
    return stream;
  }

  async removeStream(id: string, classroomId: string, school: User) {
    const stream = await this.findOneStream(id, classroomId, school);
    await this.prisma.stream.delete({ where: { id: stream.id } });
    return id;
  }

  async createStream(dto: CreateStreamDto, classroomId: string, school: User) {
    const classroom = await this.findOne(classroomId, school);
    const newStream = await this.prisma.stream.create({
      data: {
        name: dto.name,
        classroomId: classroom.id,
      },
    });
    return newStream;
  }

  async updateStream(
    id: string,
    classroomId: string,
    dto: UpdateStreamDto,
    school: User,
  ) {
    const stream = await this.findOneStream(id, classroomId, school);
    if (dto.classroomId) await this.findOne(dto.classroomId, school);
    await this.prisma.stream.update({
      where: { id: stream.id },
      data: { ...dto },
    });
    return await this.findOneStream(id);
  }
}
