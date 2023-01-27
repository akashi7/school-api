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
import { ERole } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import {
  CreatedResponse,
  OkResponse,
  PageResponse,
} from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { AcademicYearService } from "./academic-year.service";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";

@Controller("academic-years")
@Protected(ERole.ADMIN)
@ApiTags("Academic years")
export class AcademicYearController {
  constructor(private readonly academicYearService: AcademicYearService) {}

  @Post()
  @CreatedResponse()
  async create(@Body() createAcademicYearDto: CreateAcademicYearDto) {
    const payload = await this.academicYearService.create(
      createAcademicYearDto,
    );
    return new GenericResponse("Academic year created", payload);
  }

  @Get()
  @Protected()
  @PageResponse()
  async findAll(@Query() paginationDto: PaginationDto) {
    const payload = await this.academicYearService.findAll(paginationDto);
    return new GenericResponse("Academic years retrieved", payload);
  }

  @Patch(":id")
  @OkResponse()
  async update(
    @Param("id") id: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    const payload = await this.academicYearService.update(
      id,
      updateAcademicYearDto,
    );
    return new GenericResponse("Academic year updated", payload);
  }

  @Patch(":id/set-current")
  @OkResponse()
  async setCurrentAcademicYear(@Param("id") id: string) {
    const payload = await this.academicYearService.setCurrent(id);
    return new GenericResponse("Academic year updated", payload);
  }

  @Delete(":id")
  @OkResponse()
  async remove(@Param("id") id: string) {
    const payload = await this.academicYearService.remove(id);
    return new GenericResponse("Academic year deleted", payload);
  }
}
