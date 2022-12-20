import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateSchoolDto } from "../user/dto/create-user.dto";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { SchoolService } from "./school.service";

@Controller("schools")
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

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: string) {
    const payload = await this.schoolService.findOne(+id);
    return new GenericResponse("School retrieved", payload);
  }
}
