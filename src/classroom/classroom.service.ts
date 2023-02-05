import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a classroom
   * @param dto Request body
   * @param user logged in user
   * @returns classroom
   */
  async create(dto: CreateClassroomDto, user: User) {
    if (
      await this.prismaService.classroom.count({
        where: {
          schoolId: user.schoolId,
          name: { equals: dto.name, mode: "insensitive" },
        },
      })
    )
      throw new BadRequestException(`Classroom ${dto.name} already exists`);
    const newClassroom = await this.prismaService.classroom.create({
      data: {
        name: dto.name,
        schoolId: user.schoolId,
      },
    });
    return newClassroom;
  }

  /**
   * Find all classrooms
   * @param param0 Pagination object
   * @param findDto find options
   * @param user logged in user
   * @returns classrooms
   */
  async findAll(
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
    user: User,
  ) {
    const whereConditions: Prisma.ClassroomWhereInput = {};
    if (findDto.schoolId) whereConditions.schoolId = findDto.schoolId; // Override finding by current logged in school if the id is provided
    if (findDto.search)
      whereConditions.name = { contains: findDto.search, mode: "insensitive" };
    const result = await paginate<Classroom, Prisma.ClassroomFindManyArgs>(
      this.prismaService.classroom,
      { where: { schoolId: user.schoolId, ...whereConditions } },
      +page,
      +size,
    );
    return result;
  }

  /**
   * Find one classroom
   * @param id classroom id
   * @param user logged in user
   * @returns classroom
   */
  async findOne(id: string, user?: User) {
    const classroom = await this.prismaService.classroom.findFirst({
      where: user ? { schoolId: user.schoolId, id } : { id },
    });
    if (!classroom) throw new NotFoundException("Classroom not found");
    return classroom;
  }

  /**
   * Update a classroom
   * @param id classroom id
   * @param dto update object
   * @param user logged in user
   * @returns classroom
   */
  async update(id: string, dto: UpdateClassroomDto, user: User) {
    const classroom = await this.findOne(id, user);
    await this.prismaService.classroom.update({
      where: { id: classroom.id },
      data: {
        ...dto,
      },
    });
    return await this.findOne(id);
  }

  /**
   * Delete a classroom
   * @param id classroom id
   * @param user logged in user
   * @returns classroom id
   */
  async remove(id: string, user: User) {
    const classroom = await this.findOne(id, user);
    await this.prismaService.classroom.delete({ where: { id: classroom.id } });
    return id;
  }

  /**
   * Find a classroom's streams
   * @param classroomId classroom id
   * @param param1 pagination options
   * @param findDto find options
   * @param user logged in user
   * @returns streams
   */
  async findClassroomStreams(
    classroomId: string,
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
    user: User,
  ) {
    const whereConditions: Prisma.StreamWhereInput = { classroomId };
    if (findDto.schoolId)
      whereConditions.classroom = { schoolId: findDto.schoolId }; // Override finding by current logged in school if the id is provided
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
      this.prismaService.stream,
      {
        where: { classroom: { schoolId: user.schoolId }, ...whereConditions },
        include: { classroom: { select: { id: true, name: true } } },
      },
      +page,
      +size,
    );
    return result;
  }
  async findAllStreams(
    user: User,
    { page, size }: PaginationDto,
    findDto: FindClassroomsDto,
  ) {
    const whereConditions: Prisma.StreamWhereInput = {};
    if (findDto.schoolId)
      whereConditions.classroom = { schoolId: findDto.schoolId }; // Override finding by current logged in school if the id is provided
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
      this.prismaService.stream,
      {
        where: { classroom: { schoolId: user.schoolId }, ...whereConditions },
        include: { classroom: { select: { id: true, name: true } } },
      },
      +page,
      +size,
    );
    return result;
  }

  /**
   * Find one stream
   * @param streamId stream id
   * @param classroomId classroom id
   * @param user logged in user
   * @returns stream
   */
  async findOneStream(streamId: string, classroomId?: string, user?: User) {
    const stream = await this.prismaService.stream.findFirst({
      where: user
        ? classroomId
          ? {
              classroom: { schoolId: user.schoolId },
              id: streamId,
              classroomId,
            }
          : { classroom: { schoolId: user.schoolId }, id: streamId }
        : classroomId
        ? { id: streamId, classroomId }
        : { id: streamId },
    });
    if (!stream) throw new NotFoundException("Stream not found");
    return stream;
  }

  /**
   * Delete a stream
   * @param streamId stream id
   * @param classroomId classroom id
   * @param user logged in user
   * @returns stream id
   */
  async removeStream(streamId: string, classroomId: string, user: User) {
    const stream = await this.findOneStream(streamId, classroomId, user);
    await this.prismaService.stream.delete({ where: { id: stream.id } });
    return streamId;
  }

  /**
   * Create a stream
   * @param dto create object
   * @param classroomId classroom id
   * @param user logged in user
   * @returns stream
   */
  async createStream(dto: CreateStreamDto, classroomId: string, user: User) {
    const classroom = await this.findOne(classroomId, user);
    const newStream = await this.prismaService.stream.create({
      data: {
        name: dto.name,
        classroomId: classroom.id,
      },
    });
    return newStream;
  }

  /**
   * Update a stream
   * @param id stream id
   * @param classroomId classroom id
   * @param dto update object
   * @param user logged in user
   * @returns stream
   */
  async updateStream(
    id: string,
    classroomId: string,
    dto: UpdateStreamDto,
    user: User,
  ) {
    const stream = await this.findOneStream(id, classroomId, user);
    if (dto.classroomId) await this.findOne(dto.classroomId, user);
    await this.prismaService.stream.update({
      where: { id: stream.id },
      data: { ...dto },
    });
    return await this.findOneStream(id);
  }
}
