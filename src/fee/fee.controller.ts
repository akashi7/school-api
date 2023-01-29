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
import { ERole, User } from "@prisma/client";
import { Auth } from "../auth/decorators/auth.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { CreatedResponse, PageResponse } from "../__shared__/decorators";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { PaginationDto } from "../__shared__/dto/pagination.dto";
import { CreateFeeDto } from "./dto/create-fee.dto";
import { FindFeesDto } from "./dto/find-fees.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";
import { FeeService } from "./fee.service";

@Controller("fees")
@Auth(ERole.SCHOOL)
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
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() findDto: FindFeesDto,
    @GetUser() user: User,
  ) {
    const payload = await this.feeService.findAll(user, paginationDto, findDto);
    return new GenericResponse("Fees retrieved", payload);
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
