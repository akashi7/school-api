import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { Response } from "express";
import {
  CreatedResponse,
  PageResponse,
  Paginated,
  PaginationParams,
} from "src/__shared__/decorators";
import { GenericResponse } from "src/__shared__/dto/generic-response.dto";
import { IPagination } from "src/__shared__/interfaces/pagination.interface";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { DeductibleTypeService } from "./deductible-type.service";
import { createDeductibleTypesDto } from "./dto/create-dtype.dto";
import { DownloadExcelDto } from "./dto/download.dto";
import { FindDeductiblesTypesDto } from "./dto/search-dtypes.dto";

@Controller("deductible-types")
@ApiTags("Deductible-types")
export class DeductibleTypeController {
  constructor(private readonly deductibleTypesService: DeductibleTypeService) {}

  @Post()
  @CreatedResponse()
  @Auth(ERole.SCHOOL)
  async createDeductible(
    @Body() dto: createDeductibleTypesDto,
    @GetUser() user: User,
  ) {
    const payload = await this.deductibleTypesService.create(dto, user);
    return new GenericResponse("Deductible type Created !", payload);
  }

  @Get()
  @Paginated()
  @PageResponse()
  @Auth(ERole.SCHOOL, ERole.EMPLOYEE)
  async geDeductibles(
    @Query() dto: FindDeductiblesTypesDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.deductibleTypesService.findAll(
      dto,
      options,
      user,
    );
    return new GenericResponse("Deductible types retrieved", payload);
  }

  @Auth(ERole.SCHOOL, ERole.EMPLOYEE)
  @Get("employees/download")
  async downloadPayroll(
    @GetUser() user: User,
    @Res() res: Response,
    @Query() dto: DownloadExcelDto,
  ) {
    const { workbook, filename } =
      await this.deductibleTypesService.downloadDeductibles(user, dto);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}.xlsx`,
    });
    workbook.xlsx.write(res).then(() => res.end());
  }
}
