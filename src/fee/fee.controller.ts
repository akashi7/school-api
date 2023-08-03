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
import { CreatedResponse, PageResponse } from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { CreateFeeDto } from "./dto/create-fee.dto";
import {
  DownloadFeesByClassroomsDto,
  DownloadFeesByStudentsDto,
} from "./dto/download-fees.dto";
import { FindFeesDto } from "./dto/find-fees.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";
import { FeeService } from "./fee.service";

@Controller("fees")
@Auth(ERole.SCHOOL, ERole.PARENT)
@ApiTags("Fees")
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Post()
  @CreatedResponse()
  async create(@Body() dto: CreateFeeDto, @GetUser() user: User) {
    const payload = await this.feeService.create(dto, user);
    return new GenericResponse("Fee created", payload);
  }

  @Get()
  @PageResponse()
  @Auth(ERole.SCHOOL, ERole.PARENT, ERole.RELATIVE, ERole.STUDENT, ERole.ADMIN)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() findDto: FindFeesDto,
    @GetUser() user: User,
  ) {
    const payload = await this.feeService.findAll(paginationDto, findDto, user);
    return new GenericResponse("Fees retrieved", payload);
  }

  @Get("classrooms/download")
  async downloadFeesByClassrooms(
    @Query() dto: DownloadFeesByClassroomsDto,
    @GetUser() user: User,
    @Res() res: Response,
  ) {
    const { workbook, filename } =
      await this.feeService.downloadFeesByClassrooms(dto, user);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // "Content-Length": buffer.length,
      "Content-Disposition": `attachment; filename=${filename}.xlsx`,
    });
    workbook.xlsx.write(res).then(() => res.end());
  }

  @Get("students/download")
  async downloadFeesByStudents(
    @Query() dto: DownloadFeesByStudentsDto,
    @GetUser() user: User,
    @Res() res: Response,
  ) {
    const { workbook, filename } = await this.feeService.downloadFeesByStudents(
      dto,
      user,
    );
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}.xlsx`,
    });
    workbook.xlsx.write(res).then(() => res.end());
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateFeeDto: UpdateFeeDto,
    @GetUser() user: User,
  ) {
    const payload = await this.feeService.update(id, updateFeeDto, user);
    return new GenericResponse("Fee updated", payload);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.feeService.remove(id, user);
    return new GenericResponse("Fee deleted", payload);
  }
}
