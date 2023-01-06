import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { AllowRoles } from "../auth/decorators/roles.decorator";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { ClassroomService } from "./classroom.service";
import { CreateClassroomDto } from "./dto/create-classroom.dto";
import { FindClassroomsDto } from "./dto/find-classrooms.dto";
import { UpdateClassroomDto } from "./dto/update-classroom.dto";

@Controller("classrooms")
@Protected(ERole.SCHOOL)
@ApiTags("Classrooms")
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @CreatedResponse()
  async create(
    @Body() createClassroomDto: CreateClassroomDto,
    @GetUser() user: User,
  ) {
    const payload = await this.classroomService.create(
      createClassroomDto,
      user,
    );
    return new GenericResponse("Classroom created", payload);
  }

  @Get()
  @AllowRoles()
  @PageResponse()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User,
    @Query() findDto: FindClassroomsDto,
  ) {
    const payload = await this.classroomService.findAll(
      user,
      paginationDto,
      findDto,
    );
    return new GenericResponse("Classrooms retrieved", payload);
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

  @Delete(":id")
  @OkResponse()
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.classroomService.remove(id, user);
    return new GenericResponse("Classroom deleted", payload);
  }
}
