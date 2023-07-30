import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "src/__shared__/decorators";
import { GenericResponse } from "src/__shared__/dto/generic-response.dto";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { EmployeeSearchDto } from "./dto/search-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeService } from "./employee.service";

@Controller("employees")
@ApiTags("Employees")
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createEmployee(@Body() dto: CreateEmployeeDto, @GetUser() user: User) {
    const payload = await this.employeeService.create(dto, user);
    return new GenericResponse("Employee Created !", payload);
  }

  @Get()
  @Paginated()
  @PageResponse()
  @Auth(ERole.SCHOOL, ERole.ADMIN)
  async getEmployees(
    @Query() dto: EmployeeSearchDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.employeeService.findAll(dto, options, user);
    return new GenericResponse("Employees retrieved", payload);
  }

  @Get(":id")
  @Auth(ERole.SCHOOL, ERole.EMPLOYEE)
  @OkResponse()
  async getStudent(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.employeeService.findOne(id, user);
    return new GenericResponse("Employee retrieved", payload);
  }

  @Patch(":id")
  @Auth(ERole.SCHOOL)
  @OkResponse()
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
    @GetUser() user: User,
  ) {
    const payload = await this.employeeService.update(id, dto, user);
    return new GenericResponse("Student updated", payload);
  }
}
