import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { CreateSchoolDto } from "./dto/create-school.dto";
import { UpdateSchoolDto } from "./dto/update-school.dto";
import { SchoolService } from "./school.service";

@Controller("schools")
@Auth(ERole.ADMIN)
@ApiTags("Schools")
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post("schools")
  async createSchool(@Body() dto: CreateSchoolDto) {
    const payload = await this.schoolService.create(dto);
    return new GenericResponse("School created", payload);
  }
  @Get()
  async findAll() {
    const payload = await this.schoolService.findAll();
    return new GenericResponse("Schools retrieved", payload);
  }

  @Get("profile")
  @Auth(ERole.SCHOOL)
  async findCurrentSchool(@GetUser() user: User) {
    const payload = await this.schoolService.findOne(user.schoolId);
    return new GenericResponse("Current school retrieved", payload);
  }

  @Patch("profile")
  @Auth(ERole.SCHOOL)
  async updateCurrentSchool(
    @Body() dto: UpdateSchoolDto,
    @GetUser() user: User,
  ) {
    const payload = await this.schoolService.update(user.schoolId, dto);
    return new GenericResponse("Current school updated", payload);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const payload = await this.schoolService.findOne(id);
    return new GenericResponse("School retrieved", payload);
  }
  @Patch("profile")
  @Auth(ERole.SCHOOL)
  async update(@Body() dto: UpdateSchoolDto, @GetUser() user: User) {
    const payload = await this.schoolService.update(user.schoolId, dto);
    return new GenericResponse("School updated", payload);
  }
  @Delete(":id")
  async delete(@Param("id") id: string) {
    const payload = await this.schoolService.delete(id);
    return new GenericResponse("School deleted", payload);
  }
}
