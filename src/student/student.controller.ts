import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import { AllowRoles } from "../auth/decorators/roles.decorator";
import { CreateStudentDto } from "../user/dto/create-user.dto";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { StudentSearchDto } from "./dto/student-search.dto";
import { StudentService } from "./student.service";

@Controller("students")
@Protected()
@ApiTags("Students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}
  @Post()
  @AllowRoles(ERole.ADMIN)
  async createStudent(@Body() dto: CreateStudentDto) {
    const payload = await this.studentService.create(dto);
    return new GenericResponse("Student created", payload);
  }
  @Get()
  async getStudents(@Query() dto: StudentSearchDto) {
    const payload = await this.studentService.findAll(dto);
    return new GenericResponse("Students retrieved", payload);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const payload = await this.studentService.findOne(id);
    return new GenericResponse("Student retrieved", payload);
  }
}
