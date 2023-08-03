import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { Response } from "express";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ClassroomService } from "./classroom.service";
import { CreateClassroomDto } from "./dto/create-classroom.dto";
import { CreateStreamDto } from "./dto/create-stream.dto";
import { DownloadClassExcelDto } from "./dto/download.dto";
import { FindClassroomsDto } from "./dto/find-classrooms.dto";
import { UpdateClassroomDto } from "./dto/update-classroom.dto";
import { UpdateStreamDto } from "./dto/update-stream.dto";

@Controller("classrooms")
@Auth(ERole.SCHOOL)
@ApiTags("Classrooms")
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @CreatedResponse()
  async create(@Body() dto: CreateClassroomDto, @GetUser() user: User) {
    const payload = await this.classroomService.create(dto, user);
    return new GenericResponse("Classroom created", payload);
  }
  @Post(":id/streams")
  @CreatedResponse()
  async createStream(
    @Param("id") classroomId: string,
    @Body() dto: CreateStreamDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.createStream(
      dto,
      classroomId,
      user,
    );
    return new GenericResponse("Stream created", payload);
  }

  @Get()
  @PageResponse()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() findDto: FindClassroomsDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.findAll(
      paginationDto,
      findDto,
      user,
    );
    return new GenericResponse("Classrooms retrieved", payload);
  }

  @Get("streams")
  @PageResponse()
  async findAllSStreams(
    @Query() paginationDto: PaginationDto,
    @Query() findDto: FindClassroomsDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.findAllStreams(
      user,
      paginationDto,
      findDto,
    );
    return new GenericResponse("Classrooms retrieved", payload);
  }

  @Get(":id/streams")
  @PageResponse()
  async findClassroomStreams(
    @Param("id") classroomId: string,
    @Query() paginationDto: PaginationDto,
    @Query() findDto: FindClassroomsDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.findClassroomStreams(
      classroomId,
      paginationDto,
      findDto,
      user,
    );
    return new GenericResponse("Streams retrieved", payload);
  }

  @Patch(":id")
  @OkResponse()
  async update(
    @Param("id") id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.update(
      id,
      updateClassroomDto,
      user,
    );
    return new GenericResponse("Classroom updated", payload);
  }

  @Patch(":id/streams/:streamId")
  @OkResponse()
  async updateStream(
    @Param("id") id: string,
    @Param("streamId") streamId: string,
    @Body() dto: UpdateStreamDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.updateStream(
      streamId,
      id,
      dto,
      user,
    );
    return new GenericResponse("Stream updated", payload);
  }

  @Delete(":id")
  @OkResponse()
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.classroomService.remove(id, user);
    return new GenericResponse("Classroom deleted", payload);
  }

  @Delete(":id/streams/:streamId")
  @OkResponse()
  async removeStream(
    @Param("id") id: string,
    @Param("streamId") streamId: string,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.removeStream(
      streamId,
      id,
      user,
    );
    return new GenericResponse("Stream deleted", payload);
  }

  @Auth(ERole.SCHOOL)
  @Get("download/files")
  async downloadPayroll(
    @GetUser() user: User,
    @Res() res: Response,
    @Query() dto: DownloadClassExcelDto,
  ) {
    const { workbook, filename } =
      await this.classroomService.downloadClassList(user, dto);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}.xlsx`,
    });
    workbook.xlsx.write(res).then(() => res.end());
  }

  @Auth(ERole.SCHOOL)
  @Get("class/pdf")
  async downloadPdfClassrooms(
    @GetUser() user: User,
    @Query() dto: DownloadClassExcelDto,
  ) {
    const result = await this.classroomService.pdfClassList(user, dto);
    return new GenericResponse("Stream student", result);
  }
}
