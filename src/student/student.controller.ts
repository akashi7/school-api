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
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { IPagination } from "../__shared__/interfaces/pagination.interface";
import { CreateStudentDto } from "./dto/create-student.dto";
import { StudentSearchDto } from "./dto/student-search.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentService } from "./student.service";

@Controller("students")
@Protected(ERole.SCHOOL)
@ApiTags("Students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @CreatedResponse()
  async createStudent(@Body() dto: CreateStudentDto, @GetUser() user: User) {
    const payload = await this.studentService.create(dto, user);
    return new GenericResponse("Student created", payload);
  }
  @Get()
  @Paginated()
  @PageResponse()
  async getStudents(
    @Query() dto: StudentSearchDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.findAll(dto, options, user);
    return new GenericResponse("Students retrieved", payload);
  }
  @Get(":id")
  @OkResponse()
  async getStudent(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.findOne(id, user);
    return new GenericResponse("Student retrieved", payload);
  }

  @Patch(":id")
  @OkResponse()
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @GetUser() user: User,
  ) {
    const payload = await this.studentService.update(id, dto, user);
    return new GenericResponse("Student updated", payload);
  }
  @Delete(":id")
  @OkResponse()
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.studentService.remove(id, user);
    return new GenericResponse("Student deleted", payload);
  }
}
