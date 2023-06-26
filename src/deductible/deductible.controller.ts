import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
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
import { DeductibleService } from "./deductible.service";
import { CreateDeductibleDto } from "./dto/create-deductible";
import { FindDeductiblesDto } from "./dto/find-deductibles";

@Controller("deductibles")
@ApiTags("Deductibles")
export class DeductibleController {
  constructor(private readonly deductibleService: DeductibleService) {}

  @Post()
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createDeductible(
    @Body() dto: CreateDeductibleDto,
    @GetUser() user: User,
  ) {
    const payload = await this.deductibleService.create(dto, user);
    return new GenericResponse("Deductible Created !", payload);
  }

  @Get()
  @Paginated()
  @PageResponse()
  @Auth(ERole.SCHOOL)
  async geDeductibles(
    @Query() dto: FindDeductiblesDto,
    @PaginationParams() options: IPagination,
    @GetUser() user: User,
  ) {
    const payload = await this.deductibleService.findAll(dto, options, user);
    return new GenericResponse("Deductibles retrieved", payload);
  }
}
