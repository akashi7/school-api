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
import { CreateStudentDto } from "../user/dto/create-user.dto";
import { UserService } from "../user/user.service";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { StudentSearchDto } from "./dto/student-search.dto";
import { StudentService } from "./student.service";

@Controller("students")
@ApiTags("Students")
export class StudentController {
  constructor(
    private readonly userService: UserService,
    private readonly studentService: StudentService,
  ) {}
  @Post()
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
  async findOne(@Param("id", ParseIntPipe) id: string) {
    const payload = await this.studentService.findOne(+id);
    return new GenericResponse("Parent retrieved", payload);
  }
}
