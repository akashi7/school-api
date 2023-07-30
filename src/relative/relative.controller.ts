import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERole, User } from "@prisma/client";
import { GenericResponse } from "src/__shared__/dto/generic-response.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { CreateParentDto } from "src/parent/dto/create-parent.dto";
import { RelativeService } from "./relative.service";

@Controller("relative")
@ApiTags("relatives")
export class RelativeController {
  constructor(private readonly relative: RelativeService) {}
  // @Get()
  // @Auth(ERole.SCHOOL, ERole.ADMIN)
  // async findAll(@GetUser() user: User) {
  //   const payload = await this.relative.findAll(user);
  //   return new GenericResponse("Parents retrieved", payload);
  // }

  @Get("children")
  @Auth(ERole.PARENT)
  async getChildren(@GetUser() user: User) {
    const payload = await this.relative.getChildren(user.id);
    return new GenericResponse("Children retrieved", payload);
  }

  @Post(":id")
  @Auth(ERole.PARENT, ERole.RELATIVE)
  async assign(@Param("id") id: string, @GetUser() user: User) {
    const payload = await this.relative.assignStudent(id, user);
    return new GenericResponse("Student assigned", payload);
  }

  @Post()
  async createParent(@Body() dto: CreateParentDto) {
    const payload = await this.relative.create(dto);
    return new GenericResponse("Relative created", payload);
  }
}
