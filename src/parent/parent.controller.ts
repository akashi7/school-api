import { Body, Controller, Post } from "@nestjs/common";

import { Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole } from "@prisma/client";
import { Protected } from "../auth/decorators/auth.decorator";
import { AllowRoles } from "../auth/decorators/roles.decorator";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { CreateParentDto } from "./dto/create-parent.dto";
import { ParentService } from "./parent.service";

@Controller("parents")
@ApiTags("Parents")
@Protected()
export class ParentController {
  constructor(private readonly parentService: ParentService) {}
  @Get()
  async findAll() {
    const payload = await this.parentService.findAll();
    return new GenericResponse("Parents retrieved", payload);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const payload = await this.parentService.findOne(id);
    return new GenericResponse("Parent retrieved", payload);
  }

  @Post()
  @AllowRoles(ERole.ADMIN)
  async createParent(@Body() dto: CreateParentDto) {
    const payload = await this.parentService.create(dto);
    return new GenericResponse("Parent created", payload);
  }
}
