import { Body, Controller, Get, Post, Query } from "@nestjs/common";
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
import { createInstallmentDto } from "./dto/create-installment.dto";
import { FindInstallmentDto } from "./dto/find-installments.dto";
import { InstallmentService } from "./installment.service";

@Controller("installments")
@ApiTags("Installments")
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Post()
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createInstallment(
    @Body() dto: createInstallmentDto,
    @GetUser() user: User,
  ) {
    const payload = await this.installmentService.createInstallment(dto, user);
    return new GenericResponse("Installment Created !", payload);
  }

  @Get()
  @Auth(ERole.SCHOOL)
  @Paginated()
  @PageResponse()
  @OkResponse()
  async getInstallment(
    @Query() dto: FindInstallmentDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.installmentService.findAllInstallment(
      dto,
      options,
      user,
    );
    return new GenericResponse("Installments retrived !", payload);
  }
}
