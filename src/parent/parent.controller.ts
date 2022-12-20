import { Body, Controller, Post } from "@nestjs/common";

import { Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateParentDto } from "../user/dto/create-user.dto";
import { GenericResponse } from "../__shared__/dto/generic-response.dto";
import { ParentService } from "./parent.service";

@Controller("parents")
@ApiTags("Parents")
export class ParentController {
  constructor(private readonly parentService: ParentService) {}
  @Get()
  async findAll() {
    const payload = await this.parentService.findAll();
    return new GenericResponse("Parents retrieved", payload);
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: string) {
    const payload = await this.parentService.findOne(+id);
    return new GenericResponse("Parent retrieved", payload);
  }

  @Post()
  async createParent(@Body() dto: CreateParentDto) {
    const payload = await this.parentService.create(dto);
    return new GenericResponse("Parent created", payload);
  }
}
