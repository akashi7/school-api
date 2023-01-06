import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import { AllowRoles } from "../auth/decorators/roles.decorator";
import { CreateSchoolDto } from "../user/dto/create-user.dto";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { SchoolService } from "./school.service";

@Controller("schools")
@Protected()
@ApiTags("Schools")
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post("schools")
  @AllowRoles(ERole.ADMIN)
  async createSchool(@Body() dto: CreateSchoolDto) {
    const payload = await this.schoolService.create(dto);
    return new GenericResponse("School created", payload);
  }
  @Get()
  async findAll() {
    const payload = await this.schoolService.findAll();
    return new GenericResponse("Schools retrieved", payload);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const payload = await this.schoolService.findOne(id);
    return new GenericResponse("School retrieved", payload);
  }
  @Delete(":id")
  async delete(@Param("id") id: string) {
    const payload = await this.schoolService.delete(id);
    return new GenericResponse("School deleted", payload);
  }
}
