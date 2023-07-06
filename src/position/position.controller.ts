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
import { createPositionDto } from "./dto/employee-position.dto";
import { PositionSearchDto } from "./dto/search-position.dto";
import { PositionService } from "./position.service";

@Controller("positions")
@ApiTags("Positions")
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  @Auth(ERole.SCHOOL)
  @CreatedResponse()
  async createEmployeePosition(
    @Body() dto: createPositionDto,
    @GetUser() user: User,
  ) {
    const payload = await this.positionService.createEmployeePosition(
      dto,
      user,
    );
    return new GenericResponse("Position Created !", payload);
  }

  @Get()
  @Auth(ERole.SCHOOL)
  @OkResponse()
  @Paginated()
  @PageResponse()
  async getEmployeePositions(
    @Query() dto: PositionSearchDto,
    @GetUser() user: User,
    @PaginationParams() options: IPagination,
  ) {
    const payload = await this.positionService.findAllPosition(
      dto,
      options,
      user,
    );
    return new GenericResponse("Positions retrived !", payload);
  }
}
